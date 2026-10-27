/* tb.c — rus shashkasi uchun endshpil bazasi (kichik donalar soni uchun mukammal natija).
   Har bir material (oq dona, oq damka, qora dona, qora damka soni) uchun alohida fayl: tb/W{wm}{wk}B{bm}{bk}.bin
   Qiymat (1 bayt, yurish navbatidagi tomon nuqtai nazaridan):
     0   — durang (yoki noma'lum)
     1..127   — yutadi, d = yarim yurishlar soni (eng qisqa yo'l)
     128..254 — yutqazadi, d = qiymat-128 (eng uzun qarshilik)
     255 — mumkin bo'lmagan pozitsiya
   Kvadratlar: 0..31, r = s/4 (0 — 8-gorizontal), c = 2*(s%4) + (r juft bo'lsa 1 : 0).
   Oq yuqoriga (r kamayadi), r=0 da damka; qora pastga, r=7 da damka.
   Kompilyatsiya: gcc -O3 -o tbgen tb.c ; ishga tushirish: ./tbgen 4 tb */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#define MAXP 6
static int NMAX = 4;
static const char *OUT = "tb";
static long long Cn[40][8];

static int SQ(int r, int c) { return r * 4 + c / 2; }
static int RR(int s) { return s >> 2; }
static int CC(int s) { int r = s >> 2; return 2 * (s & 3) + ((r % 2 == 0) ? 1 : 0); }
static int ins(int r, int c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

typedef struct { int wm, wk, bm, bk; long long nwm, nwk, nbm, nbk, size; uint8_t *v; int done; } Slice;
static Slice *SL[5][5][5][5];

static long long comb(int n, int k) { return (k < 0 || k > n) ? 0 : Cn[n][k]; }
/* kombinatsiya raqami: o'sish tartibidagi p[0]<p[1]<... */
static long long rankc(const int *p, int k) { long long x = 0; for (int i = 0; i < k; i++) x += comb(p[i], i + 1); return x; }
static void unrankc(long long x, int k, int n, int *p) {
  for (int i = k; i >= 1; i--) { int m = i - 1; while (m + 1 < n && comb(m + 1, i) <= x) m++; p[i - 1] = m; x -= comb(m, i); }
}

static Slice *slice(int wm, int wk, int bm, int bk) {
  if (wm < 0 || wk < 0 || bm < 0 || bk < 0 || wm + wk + bm + bk > NMAX) return NULL;
  Slice *s = SL[wm][wk][bm][bk];
  if (!s) {
    s = calloc(1, sizeof(Slice)); s->wm = wm; s->wk = wk; s->bm = bm; s->bk = bk;
    s->nwm = comb(28, wm); s->nwk = comb(32, wk); s->nbm = comb(28, bm); s->nbk = comb(32, bk);
    s->size = s->nwm * s->nwk * s->nbm * s->nbk * 2;
    SL[wm][wk][bm][bk] = s;
  }
  return s;
}

/* doska → indeks (stm: 0 oq, 1 qora) */
static long long indexOf(const int *b, int stm, Slice **out) {
  int wm[MAXP], wk[MAXP], bm[MAXP], bk[MAXP], a = 0, k = 0, m = 0, n = 0;
  for (int s = 0; s < 32; s++) {
    int p = b[s];
    if (p == 1) wm[a++] = s - 4; else if (p == 2) wk[k++] = s; else if (p == -1) bm[m++] = s; else if (p == -2) bk[n++] = s;
  }
  Slice *S = slice(a, k, m, n); *out = S; if (!S) return -1;
  long long i = rankc(wm, a); i = i * S->nwk + rankc(wk, k); i = i * S->nbm + rankc(bm, m); i = i * S->nbk + rankc(bk, n);
  return i * 2 + stm;
}
/* indeks → doska; 0 — mumkin emas (ustma-ust) */
static int boardOf(Slice *S, long long idx, int *b, int *stm) {
  memset(b, 0, 32 * sizeof(int));
  *stm = (int)(idx & 1); idx >>= 1;
  long long ibk = idx % S->nbk; idx /= S->nbk;
  long long ibm = idx % S->nbm; idx /= S->nbm;
  long long iwk = idx % S->nwk; idx /= S->nwk;
  long long iwm = idx;
  int p[MAXP];
  unrankc(iwm, S->wm, 28, p); for (int i = 0; i < S->wm; i++) { int s = p[i] + 4; if (b[s]) return 0; b[s] = 1; }
  unrankc(iwk, S->wk, 32, p); for (int i = 0; i < S->wk; i++) { int s = p[i]; if (b[s]) return 0; b[s] = 2; }
  unrankc(ibm, S->bm, 28, p); for (int i = 0; i < S->bm; i++) { int s = p[i]; if (b[s]) return 0; b[s] = -1; }
  unrankc(ibk, S->bk, 32, p); for (int i = 0; i < S->bk; i++) { int s = p[i]; if (b[s]) return 0; b[s] = -2; }
  return 1;
}

/* ---------- yurishlar: har bir natija doskasi uchun callback */
typedef void (*CB)(const int *child, void *ctx);
static const int DR[4] = { -1, -1, 1, 1 }, DC[4] = { -1, 1, -1, 1 };
static int sideOf(int p) { return p > 0 ? 1 : p < 0 ? -1 : 0; }

static void emit(const int *b, int from, int to, const int *taken, int nt, int side, int promo, CB cb, void *ctx) {
  int n[32]; memcpy(n, b, sizeof n);
  int p = n[from]; n[from] = 0;
  for (int i = 0; i < nt; i++) n[taken[i]] = 0;
  if ((p == 1 || p == -1) && (promo || (side > 0 && RR(to) == 0) || (side < 0 && RR(to) == 7))) p = 2 * side;
  n[to] = p; cb(n, ctx);
}
/* zanjirli urish; olingan donalar oxirigacha turadi (ikki marta urib bo'lmaydi).
   cb == NULL — faqat "urish bormi?" tekshiruvi. */
static int capFrom(const int *b, int side, int start, int r, int c, int king, int *taken, int nt, int promo, CB cb, void *ctx) {
  int any = 0;
  for (int d = 0; d < 4; d++) {
    if (king) {
      int nr = r + DR[d], nc = c + DC[d];
      while (ins(nr, nc) && (!b[SQ(nr, nc)] || SQ(nr, nc) == start)) { nr += DR[d]; nc += DC[d]; }
      if (!ins(nr, nc)) continue;
      int v = SQ(nr, nc), dup = 0;
      if (sideOf(b[v]) != -side) continue;
      for (int i = 0; i < nt; i++) if (taken[i] == v) dup = 1;
      if (dup) continue;
      int lands[8], nl = 0, lr = nr + DR[d], lc = nc + DC[d];
      while (ins(lr, lc) && (!b[SQ(lr, lc)] || SQ(lr, lc) == start)) { lands[nl++] = SQ(lr, lc); lr += DR[d]; lc += DC[d]; }
      if (!nl) continue;
      any = 1; if (!cb) return 1;
      taken[nt] = v;
      int cont[8], ncn = 0;
      for (int i = 0; i < nl; i++) if (capFrom(b, side, start, RR(lands[i]), CC(lands[i]), 1, taken, nt + 1, 1, NULL, NULL)) cont[ncn++] = lands[i];
      if (ncn) { for (int i = 0; i < ncn; i++) { taken[nt] = v; capFrom(b, side, start, RR(cont[i]), CC(cont[i]), 1, taken, nt + 1, 1, cb, ctx); } }
      else for (int i = 0; i < nl; i++) { taken[nt] = v; emit(b, start, lands[i], taken, nt + 1, side, 1, cb, ctx); }
    } else {
      int mr = r + DR[d], mc = c + DC[d], lr = r + 2 * DR[d], lc = c + 2 * DC[d];
      if (!ins(lr, lc)) continue;
      int v = SQ(mr, mc), l = SQ(lr, lc), dup = 0;
      if (sideOf(b[v]) != -side || (b[l] && l != start)) continue;
      for (int i = 0; i < nt; i++) if (taken[i] == v) dup = 1;
      if (dup) continue;
      any = 1; if (!cb) return 1;
      taken[nt] = v;
      int pr = promo || (side > 0 && lr == 0) || (side < 0 && lr == 7);
      if (capFrom(b, side, start, lr, lc, pr, taken, nt + 1, pr, NULL, NULL)) { taken[nt] = v; capFrom(b, side, start, lr, lc, pr, taken, nt + 1, pr, cb, ctx); }
      else { taken[nt] = v; emit(b, start, l, taken, nt + 1, side, pr, cb, ctx); }
    }
  }
  return any;
}
/* barcha yurishlar; qaytaradi: yurishlar soni */
typedef struct { CB cb; void *ctx; int n; } Cnt;
static void cntcb(const int *ch, void *x) { Cnt *c = x; c->n++; c->cb(ch, c->ctx); }
static int genMoves(const int *b, int side, CB cb, void *ctx) {
  Cnt C = { cb, ctx, 0 };
  int taken[16], hasCap = 0;
  for (int s = 0; s < 32; s++) if (b[s] && sideOf(b[s]) == side) {
    int king = (b[s] == 2 || b[s] == -2);
    if (capFrom(b, side, s, RR(s), CC(s), king, taken, 0, 0, NULL, NULL)) { hasCap = 1; break; }
  }
  if (hasCap) {
    for (int s = 0; s < 32; s++) if (b[s] && sideOf(b[s]) == side) {
      int king = (b[s] == 2 || b[s] == -2);
      capFrom(b, side, s, RR(s), CC(s), king, taken, 0, 0, cntcb, &C);
    }
    return C.n;
  }
  for (int s = 0; s < 32; s++) if (b[s] && sideOf(b[s]) == side) {
    int king = (b[s] == 2 || b[s] == -2), r = RR(s), c = CC(s);
    for (int d = 0; d < 4; d++) {
      if (!king && DR[d] != -side) continue;
      int nr = r + DR[d], nc = c + DC[d];
      while (ins(nr, nc) && !b[SQ(nr, nc)]) {
        int t[1]; emit(b, s, SQ(nr, nc), t, 0, side, 0, cntcb, &C);
        if (!king) break;
        nr += DR[d]; nc += DC[d];
      }
    }
  }
  return C.n;
}

/* ---------- qiymatlar */
#define INV 255
static int isWin(int v) { return v >= 1 && v <= 127; }
static int isLoss(int v) { return v >= 128 && v <= 254; }

typedef struct { int stmNext; Slice *self; int bestWin; int allWin; int maxWin; int unknown; } Ev;
/* bola pozitsiyaning qiymati (bola navbatdagi tomon nuqtai nazaridan) */
static int childVal(const int *ch, int stm) {
  int w = 0, bl = 0; for (int s = 0; s < 32; s++) { if (ch[s] > 0) w++; else if (ch[s] < 0) bl++; }
  if ((stm == 0 && w == 0) || (stm == 1 && bl == 0)) return 128;   /* donasi qolmadi — yutqazgan */
  Slice *S; long long i = indexOf(ch, stm, &S);
  if (!S || !S->v) { fprintf(stderr, "bo'lak yo'q!\n"); exit(1); }
  return S->v[i];
}
static void evcb(const int *ch, void *x) {
  Ev *e = x; int v = childVal(ch, e->stmNext);
  if (isLoss(v)) { int d = v - 128 + 1; if (e->bestWin < 0 || d < e->bestWin) e->bestWin = d; e->allWin = 0; }
  else if (isWin(v)) { if (v > e->maxWin) e->maxWin = v; }
  else { e->allWin = 0; e->unknown = 1; }
}

static int maxDist = 0;
static void solve(Slice *S) {
  S->v = malloc(S->size); memset(S->v, 0, S->size);
  int b[32], stm; long long valid = 0;
  for (long long i = 0; i < S->size; i++) { if (!boardOf(S, i, b, &stm)) S->v[i] = INV; else valid++; }
  int ext = maxDist;
  /* har pozitsiya uchun bir martalik hisob: bolalar qiymatlari ichida eng yaxshi */
  long long changed = 1; int pass = 0;
  uint8_t *res = malloc(S->size);   /* hal bo'lmagan = 0 */
  memcpy(res, S->v, S->size);
  for (pass = 0; ; pass++) {
    changed = 0;
    for (long long i = 0; i < S->size; i++) {
      if (S->v[i]) continue;
      boardOf(S, i, b, &stm);
      Ev e = { stm ^ 1, S, -1, 1, 0, 0 };
      int n = genMoves(b, stm == 0 ? 1 : -1, evcb, &e);
      if (n == 0) { if (pass == 0) { res[i] = 128; changed++; } continue; }
      if (e.bestWin == pass && pass > 0) { res[i] = (uint8_t)(pass > 127 ? 127 : pass); changed++; continue; }
      if (e.allWin && e.maxWin + 1 == pass) { res[i] = (uint8_t)(128 + (pass > 126 ? 126 : pass)); changed++; }
    }
    memcpy(S->v, res, S->size);
    if (pass > maxDist && changed) maxDist = pass;
    if (!changed && pass > ext + 1) break;
  }
  free(res);
  long long w = 0, l = 0, dr = 0;
  for (long long i = 0; i < S->size; i++) { int v = S->v[i]; if (v == INV) continue; if (isWin(v)) w++; else if (isLoss(v)) l++; else dr++; }
  printf("W%d%dB%d%d: %lld pozitsiya, yutish %lld, yutqazish %lld, durang %lld, o'tishlar %d\n", S->wm, S->wk, S->bm, S->bk, valid, w, l, dr, pass);
  fflush(stdout);
  char fn[256]; sprintf(fn, "%s/W%d%dB%d%d.bin", OUT, S->wm, S->wk, S->bm, S->bk);
  FILE *f = fopen(fn, "wb"); if (f) { fwrite(S->v, 1, S->size, f); fclose(f); }
  S->done = 1;
}

static void prcb(const int *ch, void *x) { (void)x; for (int s = 0; s < 32; s++) printf("%d%s", ch[s], s < 31 ? "," : ";"); }
int main(int argc, char **argv) {
  if (argc > 1 && !strcmp(argv[1], "test")) {   /* sinov: har qatorda 32 son va tomon → bolalar doskalari */
    int b[32], side;
    while (1) { for (int s = 0; s < 32; s++) if (scanf("%d", &b[s]) != 1) return 0; if (scanf("%d", &side) != 1) return 0; genMoves(b, side, prcb, NULL); printf("\n"); }
  }
  if (argc > 1) NMAX = atoi(argv[1]);
  if (argc > 2) OUT = argv[2];
  for (int n = 0; n < 40; n++) { Cn[n][0] = 1; for (int k = 1; k < 8; k++) Cn[n][k] = n ? Cn[n - 1][k - 1] + Cn[n - 1][k] : 0; }
  /* tartib: jami donalar soni o'sib boradi, keyin oddiy donalar soni (damkaga chiqish donani kamaytiradi) */
  for (int tot = 2; tot <= NMAX; tot++)
    for (int men = 0; men <= tot; men++)
      for (int wm = 0; wm <= men; wm++) {
        int bm = men - wm;
        for (int wk = 0; wk + wm + bm <= tot; wk++) {
          int bk = tot - wm - bm - wk;
          if (bk < 0) continue;
          if (wm + wk == 0 || bm + bk == 0) continue;
          Slice *S = slice(wm, wk, bm, bk);
          /* oldin hisoblangan faylni o'qish */
          char fn[256]; sprintf(fn, "%s/W%d%dB%d%d.bin", OUT, wm, wk, bm, bk);
          FILE *f = fopen(fn, "rb");
          if (f) { S->v = malloc(S->size); if (fread(S->v, 1, S->size, f) == (size_t)S->size) { S->done = 1; fclose(f);
              for (long long i = 0; i < S->size; i++) { int v = S->v[i]; int d = isWin(v) ? v : isLoss(v) ? v - 128 : 0; if (d > maxDist) maxDist = d; }
              printf("W%d%dB%d%d: fayldan\n", wm, wk, bm, bk); continue; } fclose(f); }
          solve(S);
        }
      }
  return 0;
}
