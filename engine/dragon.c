/* dragon.c — DragonBOT dvigateli (rus shashkasi).
   Baholash Skifi 0.39 (engines/skifi/EvalUnit.pas) jadvallaridan olingan.
   Qidiruv: iterativ chuqurlashuv + alfa-beta + transpozitsiya jadvali + killer/history + urishlar qo'shimcha qidiruvi.

   Protokol (stdin -> stdout), kestoai bilan bir xil uslubda:
     <color> <seconds>\n
     8 qator, har birida 4 ta son (qorong'i kataklar; qator tartibi mijozdagi doska bilan bir xil)
   Javob:
     <fromIdx> <toIdx> <jumps> <eval>\n     (idx = 0..31, pastda tavsif)

   Kataklar: i = 0..31, i = qator*4 + ustun/2. Qator 0 — oq tomonning orqa qatori (1-qator).
   Oq donalar i ortishi tomon yuradi, qora — kamayishi tomon.                                  */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define EMPTY 0
#define WM 1
#define WK 2
#define BM 3
#define BK 4

#define IS_W(p) ((p) == WM || (p) == WK)
#define IS_B(p) ((p) == BM || (p) == BK)
#define IS_K(p) ((p) == WK || (p) == BK)

/* ---------- geometriya ---------- */
static int RC[32][2];          /* katak -> (qator, ustun) */
static int ID[8][8];           /* (qator,ustun) -> katak yoki -1 */
static int RAY[32][4][8];      /* har yo'nalish bo'yicha kataklar ro'yxati */
static int RAYN[32][4];        /* yo'nalishdagi kataklar soni */
static const int DR[4] = { 1, 1, -1, -1 }, DC[4] = { 1, -1, 1, -1 };

static void initGeom(void) {
    for (int r = 0; r < 8; r++) for (int c = 0; c < 8; c++) ID[r][c] = -1;
    for (int i = 0; i < 32; i++) {
        int r = i >> 2, c = ((i & 3) << 1) + ((r & 1) ? 1 : 0);
        RC[i][0] = r; RC[i][1] = c; ID[r][c] = i;
    }
    for (int i = 0; i < 32; i++)
        for (int d = 0; d < 4; d++) {
            int n = 0, r = RC[i][0] + DR[d], c = RC[i][1] + DC[d];
            while (r >= 0 && r < 8 && c >= 0 && c < 8) { RAY[i][d][n++] = ID[r][c]; r += DR[d]; c += DC[d]; }
            RAYN[i][d] = n;
        }
}

/* ---------- holat ---------- */
typedef struct { int from, to, ncap, cap[12], prom; } Move;

static int B[32];              /* asosiy doska */
static long long NODES;
static double TIME_LIMIT;
static clock_t T0;
static int STOP;

static int timeUp(void) {
    if (STOP) return 1;
    if ((NODES & 1023) == 0 && (double)(clock() - T0) / CLOCKS_PER_SEC > TIME_LIMIT) STOP = 1;
    return STOP;
}

/* ---------- urishlar (turk zarbasi: urilgan dona yurish oxirigacha doskada qoladi) ---------- */
static Move CAPBUF[256];
static int CAPN;
static int DEAD[32];
static int ORIGK;              /* urishni boshlagan dona damka bo'lganmi */

static void capRec(int *b, int sq, int piece, int side, int *caps, int ncap, int from) {
    int found = 0;
    for (int d = 0; d < 4; d++) {
        int n = RAYN[sq][d];
        if (!IS_K(piece)) {                      /* oddiy dona: faqat qo'shni orqali */
            if (n < 2) continue;
            int m = RAY[sq][d][0], l = RAY[sq][d][1];
            int pm = b[m];
            if (!pm || DEAD[m]) continue;
            if (side > 0 ? !IS_B(pm) : !IS_W(pm)) continue;
            if (b[l] || DEAD[l]) continue;
            int np = piece, prom = 0;
            if (piece == WM && (l >> 2) == 7) { np = WK; prom = 1; }
            if (piece == BM && (l >> 2) == 0) { np = BK; prom = 1; }
            b[sq] = EMPTY; b[l] = np; DEAD[m] = 1; caps[ncap] = m;
            capRec(b, l, np, side, caps, ncap + 1, from);
            b[l] = EMPTY; b[sq] = piece; DEAD[m] = 0;
            found = 1;
        } else {                                  /* damka: uchib uradi */
            int k = 0, victim = -1;
            for (k = 0; k < n; k++) {
                int s = RAY[sq][d][k], p = b[s];
                if (DEAD[s]) break;               /* urilgan dona — to'siq */
                if (!p) { if (victim >= 0) {      /* qurbondan keyingi bo'sh katak — tushish mumkin */
                        int np = piece;
                        b[sq] = EMPTY; b[s] = np; DEAD[victim] = 1; caps[ncap] = victim;
                        capRec(b, s, np, side, caps, ncap + 1, from);
                        b[s] = EMPTY; b[sq] = piece; DEAD[victim] = 0;
                        found = 1;
                    } continue; }
                if (side > 0 ? IS_W(p) : IS_B(p)) break;        /* o'z donasi */
                if (victim >= 0) break;                          /* ketma-ket ikki dona */
                victim = s;
            }
        }
    }
    if (!found && ncap > 0 && CAPN < 256) {
        Move *m = &CAPBUF[CAPN++];
        m->from = from; m->to = sq; m->ncap = ncap;
        /* yo'l o'rtasida damka bo'lib olgan bo'lsa, yurish oxirida ham damka bo'lib qoladi */
        m->prom = IS_K(piece) && !ORIGK;
        for (int i = 0; i < ncap; i++) m->cap[i] = caps[i];
    }
}

static int genCaptures(int *b, int side, Move *out) {
    CAPN = 0; memset(DEAD, 0, sizeof(DEAD));
    int caps[12];
    for (int i = 0; i < 32; i++) {
        int p = b[i]; if (!p) continue;
        if (side > 0 ? !IS_W(p) : !IS_B(p)) continue;
        ORIGK = IS_K(p);
        capRec(b, i, p, side, caps, 0, i);
    }
    int n = CAPN > 200 ? 200 : CAPN;
    for (int i = 0; i < n; i++) out[i] = CAPBUF[i];
    return n;
}

static int genQuiet(int *b, int side, Move *out) {
    int n = 0;
    for (int i = 0; i < 32; i++) {
        int p = b[i]; if (!p) continue;
        if (side > 0 ? !IS_W(p) : !IS_B(p)) continue;
        if (!IS_K(p)) {
            for (int d = 0; d < 4; d++) {
                if (side > 0 ? (DR[d] < 0) : (DR[d] > 0)) continue;     /* oddiy dona faqat oldinga yuradi */
                if (RAYN[i][d] < 1) continue;
                int s = RAY[i][d][0];
                if (b[s]) continue;
                out[n].from = i; out[n].to = s; out[n].ncap = 0;
                out[n].prom = (p == WM && (s >> 2) == 7) || (p == BM && (s >> 2) == 0);
                n++;
            }
        } else {
            for (int d = 0; d < 4; d++)
                for (int k = 0; k < RAYN[i][d]; k++) {
                    int s = RAY[i][d][k];
                    if (b[s]) break;
                    out[n].from = i; out[n].to = s; out[n].ncap = 0; out[n].prom = 0; n++;
                }
        }
    }
    return n;
}

static int genMoves(int *b, int side, Move *out) {
    int n = genCaptures(b, side, out);
    if (n) return n;
    return genQuiet(b, side, out);
}

static void doMove(int *b, const Move *m, int *undoPiece) {
    int p = b[m->from];
    *undoPiece = p;
    b[m->from] = EMPTY;
    for (int i = 0; i < m->ncap; i++) b[m->cap[i]] = EMPTY;
    if (m->prom) p = IS_W(p) ? WK : BK;
    if (p == WM && (m->to >> 2) == 7) p = WK;
    if (p == BM && (m->to >> 2) == 0) p = BK;
    b[m->to] = p;
}

/* ---------- baholash (Skifi EvalUnit.pas) ---------- */
static const int ET[28] = {
    158, 200, 208, 217, 123, 195, 186, 153, 167, 153, 163, 141, 148, 152,
    179, 164, 170, 177,  93, 160, 158, 188, 242, 146, 162, 184, 100, 210
};
static const int ED[32] = {
    481, 446, 517, 502, 477, 497, 474, 485, 407, 554, 472, 431, 501, 446, 471, 472,
    438, 480, 474, 446, 512, 481, 399, 487, 530, 463, 511, 463, 498, 532, 483, 447
};
static const int ED1[32] = {
    500, 504, 500, 508, 500, 504, 508, 508, 504, 500, 512, 508, 504, 508, 512, 500,
    500, 512, 508, 504, 508, 512, 500, 504, 508, 508, 504, 500, 508, 500, 504, 500
};
/* katta yo'l (a1-h8) va ikkilangan burchak chiziqlari — Skifi'dagi kabi */
static int BIGROAD[8], TRI1[7], TRI2[7];

static void initLines(void) {
    int n = 0;
    for (int r = 0; r < 8; r++) { int c = r, i = ID[r][c]; if (i >= 0) BIGROAD[n++] = i; }
    n = 0; for (int r = 0; r < 7; r++) { int c = r + 2 <= 7 ? r + 2 : -1; if (c >= 0 && ID[r][c] >= 0) TRI1[n++] = ID[r][c]; }
    while (n < 7) TRI1[n++] = -1;
    n = 0; for (int r = 2; r < 8; r++) { int c = r - 2; if (ID[r][c] >= 0) TRI2[n++] = ID[r][c]; }
    while (n < 7) TRI2[n++] = -1;
}
static int lineOwner(const int *b, const int *line, int len) {   /* 0 — bo'sh/aralash, 1 — oq, 2 — qora */
    int w = 0, bl = 0;
    for (int i = 0; i < len; i++) { int s = line[i]; if (s < 0) continue; int p = b[s]; if (IS_W(p)) w = 1; else if (IS_B(p)) bl = 1; }
    if (w && !bl) return 1;
    if (bl && !w) return 2;
    return 0;
}

static int evaluate(const int *b) {
    int score = 0, kw = 0, kb = 0, nw = 0, nb = 0, L = 0;
    for (int i = 0; i < 32; i++) {
        int p = b[i];
        if (!p) continue;
        switch (p) {
            case WM: score += ET[i < 28 ? i : 27]; L += (i >> 2) - 3; nw++; break;
            case BM: score -= ET[(31 - i) < 28 ? (31 - i) : 27]; L += (i >> 2) - 4; nb++; break;
            case WK: score += ED[i]; kw++; nw++; break;
            case BK: score -= ED[31 - i]; kb++; nb++; break;
        }
    }
    int men = nw + nb - kw - kb;
    if (men <= 4) score += L * 5 * (5 - men);

    if (kw + kb) {
        if (kw + kb != nw + nb) {                      /* doskada oddiy donalar ham bor */
            int gl = lineOwner(b, BIGROAD, 8);
            if (gl == 1) score += 94; else if (gl == 2) score -= 94;
            int t1 = lineOwner(b, TRI1, 7), t2 = lineOwner(b, TRI2, 7);
            if (t1 == 1 && t2 == 1) score += 40; else if (t1 == 2 && t2 == 2) score -= 40;
        } else {                                        /* faqat damkalar */
            score = 0;
            for (int i = 0; i < 32; i++) { if (b[i] == WK) score += ED1[i]; else if (b[i] == BK) score -= ED1[31 - i]; }
            int gl = lineOwner(b, BIGROAD, 8);
            if (gl == 1) score += 200; else if (gl == 2) score -= 200;
            int t1 = lineOwner(b, TRI1, 7), t2 = lineOwner(b, TRI2, 7);
            if (t1 == 1 && t2 == 1) score += 100; else if (t1 == 2 && t2 == 2) score -= 100;
            if (kw > nb + 2 || (kw == 3 && nb == 1 && gl == 1)) score += 1000;
            if (kb > nw + 2 || (kb == 3 && nw == 1 && gl == 2)) score -= 1000;
        }
        if (nw < kb + 2 && score > 0 && kb > 0) score = 0;
        if (nb < kw + 2 && score < 0 && kw > 0) score = 0;
        score = (int)(score * 0.7);
    }
    return score;
}

/* ---------- transpozitsiya jadvali ---------- */
#define TT_BITS 20
#define TT_SIZE (1 << TT_BITS)
typedef struct { unsigned long long key; int val, depth; short from, to; char flag; } TT;
static TT *TTAB;
static unsigned long long ZOB[32][5], ZSIDE;

static void initZobrist(void) {
    unsigned long long s = 88172645463325252ULL;
    for (int i = 0; i < 32; i++) for (int p = 0; p < 5; p++) { s ^= s << 13; s ^= s >> 7; s ^= s << 17; ZOB[i][p] = s; }
    s ^= s << 13; s ^= s >> 7; s ^= s << 17; ZSIDE = s;
}
static unsigned long long hashOf(const int *b, int side) {
    unsigned long long h = side > 0 ? ZSIDE : 0;
    for (int i = 0; i < 32; i++) if (b[i]) h ^= ZOB[i][b[i]];
    return h;
}

/* ---------- qidiruv ---------- */
#define INF 1000000
#define MAXPLY 64
static Move KILL[MAXPLY][2];
static int HIST[32][32];

static int quiesce(int *b, int side, int alpha, int beta, int ply) {
    NODES++;
    if (timeUp()) return 0;
    Move mv[200];
    int n = genCaptures(b, side, mv);
    if (!n) { int e = evaluate(b); return side > 0 ? e : -e; }
    if (ply >= MAXPLY - 2) { int e = evaluate(b); return side > 0 ? e : -e; }
    for (int i = 0; i < n; i++) {
        int nb[32]; memcpy(nb, b, sizeof(nb)); int u;
        doMove(nb, &mv[i], &u);
        int v = -quiesce(nb, -side, -beta, -alpha, ply + 1);
        if (STOP) return 0;
        if (v > alpha) { alpha = v; if (alpha >= beta) return beta; }
    }
    return alpha;
}

static int search(int *b, int side, int depth, int alpha, int beta, int ply, Move *best) {
    NODES++;
    if (timeUp()) return 0;
    unsigned long long key = hashOf(b, side);
    TT *e = &TTAB[key & (TT_SIZE - 1)];
    int ttFrom = -1, ttTo = -1;
    if (e->key == key) {
        ttFrom = e->from; ttTo = e->to;
        if (e->depth >= depth && !best) {
            if (e->flag == 0) return e->val;
            if (e->flag == 1 && e->val >= beta) return e->val;
            if (e->flag == 2 && e->val <= alpha) return e->val;
        }
    }
    Move mv[200];
    int n = genMoves(b, side, mv);
    if (!n) return -INF + ply;                       /* yurish yo'q — mag'lubiyat */
    if (depth <= 0) return quiesce(b, side, alpha, beta, ply);

    /* tartiblash: TT yurishi, urishlar, killer, history */
    int sc[200];
    for (int i = 0; i < n; i++) {
        int s = mv[i].ncap * 1000 + (mv[i].prom ? 500 : 0) + HIST[mv[i].from][mv[i].to] / 64;
        if (mv[i].from == ttFrom && mv[i].to == ttTo) s += 1000000;
        if (ply < MAXPLY) {
            if (KILL[ply][0].from == mv[i].from && KILL[ply][0].to == mv[i].to) s += 8000;
            if (KILL[ply][1].from == mv[i].from && KILL[ply][1].to == mv[i].to) s += 4000;
        }
        sc[i] = s;
    }
    for (int i = 1; i < n; i++) { Move m = mv[i]; int s = sc[i], j = i - 1;
        while (j >= 0 && sc[j] < s) { mv[j + 1] = mv[j]; sc[j + 1] = sc[j]; j--; }
        mv[j + 1] = m; sc[j + 1] = s; }

    int a0 = alpha, bestVal = -INF - 1; Move bestMv = mv[0];
    for (int i = 0; i < n; i++) {
        int nb[32]; memcpy(nb, b, sizeof(nb)); int u;
        doMove(nb, &mv[i], &u);
        int ext = (n == 1 || mv[i].ncap) ? 1 : 0;     /* majburiy yurish va urish — chuqurroq */
        int v;
        if (i == 0) v = -search(nb, -side, depth - 1 + ext, -beta, -alpha, ply + 1, NULL);
        else {
            v = -search(nb, -side, depth - 1 + ext, -alpha - 1, -alpha, ply + 1, NULL);
            if (v > alpha && v < beta) v = -search(nb, -side, depth - 1 + ext, -beta, -alpha, ply + 1, NULL);
        }
        if (STOP) return 0;
        if (v > bestVal) { bestVal = v; bestMv = mv[i]; if (best) *best = mv[i]; }
        if (v > alpha) alpha = v;
        if (alpha >= beta) {
            if (!mv[i].ncap && ply < MAXPLY) { KILL[ply][1] = KILL[ply][0]; KILL[ply][0] = mv[i]; }
            HIST[mv[i].from][mv[i].to] += depth * depth;
            break;
        }
    }
    e->key = key; e->val = bestVal; e->depth = depth; e->from = bestMv.from; e->to = bestMv.to;
    e->flag = bestVal <= a0 ? 2 : (alpha >= beta ? 1 : 0);
    return bestVal;
}

/* ---------- bosh qidiruv ---------- */
static Move think(int *b, int side, double secs, int *evOut, int *depthOut) {
    TIME_LIMIT = secs; T0 = clock(); STOP = 0; NODES = 0;
    memset(HIST, 0, sizeof(HIST)); memset(KILL, 0, sizeof(KILL));
    Move mv[200]; int n = genMoves(b, side, mv);
    Move best = mv[0]; int ev = 0, d;
    for (d = 1; d <= 40; d++) {
        Move cur = best;
        int v = search(b, side, d, -INF, INF, 0, &cur);
        if (STOP) break;
        best = cur; ev = v;
        if (v > INF - 1000 || v < -INF + 1000) break;
        if ((double)(clock() - T0) / CLOCKS_PER_SEC > secs * 0.5) break;
    }
    *evOut = side > 0 ? ev : -ev;
    *depthOut = d;
    return best;
}

/* ---------- perft (qoidalarni tekshirish) ---------- */
static long long perft(int *b, int side, int depth) {
    Move mv[200];
    int n = genMoves(b, side, mv);
    if (depth <= 1) return n;
    long long s = 0;
    for (int i = 0; i < n; i++) {
        int nb[32]; memcpy(nb, b, sizeof(nb)); int u;
        doMove(nb, &mv[i], &u);
        s += perft(nb, -side, depth - 1);
    }
    return s;
}

/* ---------- protokol ---------- */
int main(int argc, char **argv) {
    initGeom(); initLines(); initZobrist();
    TTAB = (TT *)calloc(TT_SIZE, sizeof(TT));

    if (argc > 1 && !strcmp(argv[1], "perft")) {      /* sinov: perft <chuqurlik> [FEN-siz: stdin dan 32 son + tomon] */
        int maxd = argc > 2 ? atoi(argv[2]) : 4;
        int side = 1;
        memset(B, 0, sizeof(B));
        if (argc > 3 && !strcmp(argv[3], "-")) {       /* stdin: tomon + 32 katak (0/1/2/3/4) */
            if (scanf("%d", &side) != 1) return 1;
            for (int i = 0; i < 32; i++) if (scanf("%d", &B[i]) != 1) return 1;
        } else {
            for (int i = 0; i < 12; i++) B[i] = WM;
            for (int i = 20; i < 32; i++) B[i] = BM;
        }
        for (int d = 1; d <= maxd; d++) printf("%d %lld\n", d, perft(B, side, d));
        return 0;
    }

    int color; double secs;
    while (scanf("%d %lf", &color, &secs) == 2) {
        if (color == 9) { memset(TTAB, 0, (size_t)TT_SIZE * sizeof(TT)); continue; }   /* yangi o'yin: xesh tozalanadi */
        int v[32];
        for (int i = 0; i < 32; i++) if (scanf("%d", &v[i]) != 1) return 1;
        /* kelgan tartib: qator y = 0..7 (mijozdagi doska), har qatorda x kamayib boradi */
        memset(B, 0, sizeof(B));
        int k = 0;
        for (int y = 0; y < 8; y++) {
            for (int x = (y % 2 == 0 ? 7 : 6); x >= 0; x -= 2) {
                int p = v[k++], r = 7 - y, c = x, i = ID[r][c];
                if (i < 0) continue;
                B[i] = p == 5 ? WM : p == 9 ? WK : p == 6 ? BM : p == 10 ? BK : EMPTY;
            }
        }
        int side = color == 1 ? 1 : -1, ev = 0, depth = 0;
        Move m = think(B, side, secs, &ev, &depth);
        /* javob: KestoG ko'prigi bilan bir xil — idx = y*8 + (7-x), shuning uchun 7-x va y chiqadi */
        int fr = RC[m.from][0], fc = RC[m.from][1], tr = RC[m.to][0], tc = RC[m.to][1];
        printf("%d %d %d %d %d %d\n", 7 - fc, 7 - fr, 7 - tc, 7 - tr, m.ncap, ev);
        fflush(stdout);
        fprintf(stderr, "[Dragon] chuqurlik %d · tugun %lld · baho %d\n", depth, NODES, ev);
    }
    free(TTAB);
    return 0;
}
