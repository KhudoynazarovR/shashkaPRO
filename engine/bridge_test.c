#include <stdio.h>
#include <string.h>
#include "KestoG.C"

int main(void) {
    int board[8][8];
    int color;
    double maxtime;
    struct CBmove move;
    char status[1024];
    int playnow;

    while (scanf("%d %lf", &color, &maxtime) == 2) {
        memset(board, 0, sizeof(board));
        memset(&move, 0, sizeof(move));
        memset(status, 0, sizeof(status));
        playnow = 0;

        for (int y = 0; y < 8; y++) {
            int firstX = (y % 2 == 0) ? 0 : 1;

            for (int i = 0; i < 4; i++) {
                int x = firstX + i * 2;

                if (scanf("%d", &board[x][y]) != 1)
                    return 1;
            }
        }

        getmove(
            board,
            color,
            maxtime,
            status,
            &playnow,
            1,
            0,
            &move
        );

        fprintf(
            stderr,
            "[KestoG] %d,%d -> %d,%d jumps=%d\n",
            move.from.x,
            move.from.y,
            move.to.x,
            move.to.y,
            move.jumps
        );

        printf(
            "%d %d %d %d %d\n",
            move.from.x,
            move.from.y,
            move.to.x,
            move.to.y,
            move.jumps
        );

        fprintf(stderr, "STATUS: %s\n", status);
        fflush(stdout);
    }

    return 0;
}
