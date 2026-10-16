
/* includes */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
//#include <windows.h>
#include <time.h>
#include <math.h>
#include <stdint.h>
#include <stdbool.h>
#include <time.h>
#include <sys/time.h>

/* board values */
#define OCCUPIED 0	   // un_occupied dark squares
#define WHITE 1
#define BLACK 2
#define MAN 4
#define KING 8
#define FREE 16      // the light squares, always _free
#define CHANGECOLOR 3
#define MAXDEPTH 48
#define MAXMOVES 50
#define MAXHIST 65535
#define UPPER 0
#define LOWER 1
#define EXACT 2
#define MATE 5000

/*----------> compile options  */
#undef MUTE
#undef VERBOSE
#define STATISTICS

/* getmove return values */
#define DRAW 0
#define WIN 1
#define LOSS 2
#define UNKNOWN 3

#define max(a,b) ((a) > (b) ? (a) : (b))

#ifndef WINAPI
#define WINAPI
#endif

typedef uint64_t U64;
typedef uint32_t U32;

/* types */

struct coor             /* coordinate structure for board coordinates */
{
   int x;
   int y;
};

 struct CBmove    // all the information there is about a move
{
  int jumps;		         // how many jumps are there in this move?
  int newpiece;	         // what type of piece appears on to
  int oldpiece;	         // what disappears on from
  struct  coor from, to;	         // coordinates of the piece in 8x8 notation!
  struct coor path[12];	         // intermediate path coordinates
  struct  coor del[12];	         // squares whose pieces are deleted
  int delpiece[12];	         // what is on these squares
} GCBmove;

struct move2
{
    short l;            // move's length
    short m[10];
    short path[10];
 };

struct TEntry
                {
    U32 m_lock;
    int m_value:14;
    int m_depth:8;
    int m_valuetype:4;
    unsigned char m_best_from;
    unsigned char m_best_to;
  };

/* function prototypes */

int WINAPI getmove (int board[8][8], int color, double maxtime, char str[1024],
    int *playnow, int info, int unused, struct CBmove *move);
int WINAPI enginecommand (char command[256], char reply[1024]);
int WINAPI islegal (int b[8][8], int color, int from, int to,struct  CBmove *move);
void movetonotation(struct move2 move,char str[80]);

int negamax( int b[46], int depth, int alpha, int beta, int color, int iid );
int compute( int b[46],int color, int time, char output[256]);
int evaluation(int b[46], int color);
void domove(int b[46],struct move2 *move );
void undomove(int b[46],struct move2 *move );


int Gen_Captures( int b[46], struct move2 movelist[MAXMOVES] , int color );
int Gen_Moves( int b[46], struct move2 movelist[MAXMOVES] , int color );
void black_king_capture(int b[46], int *n, struct move2 movelist[MAXMOVES], int j );
void black_man_capture(int b[46], int *n, struct move2 movelist[MAXMOVES], int j );
void white_king_capture(int b[46], int *n, struct move2 movelist[MAXMOVES], int j );
void white_man_capture(int b[46], int *n, struct move2 movelist[MAXMOVES], int j );
int  test_capture(int b[46], int color);

int  Test_From_13b( int b[46],int mloc);
int  Test_From_02b( int b[46], int mloc);
int  Test_From_13w( int b[46],int mloc);
int  Test_From_02w( int b[46], int mloc);

void setbestmove(struct move2 move);
struct  coor numbertocoor(int n);

U64 rand64(void);
U64 Position_to_Hashnumber( int b[46] , int color );
void Create_HashFunction(void);
void ClearTTable(void);
void retrievepv( int b[46], char *pv, int color);
int hashretrieve(int b[46], int depth, int *value, int *alpha, int *beta, int *best_from, int *best_to, int color);
void hashstore(int b[46], int value, int depth, int alpha, int beta, int best_from, int best_to);
U64 getUniqueZobrist(void);
bool isZobristUnique(U64 key);
int weight( int depth );
void ClearHistory(void);
void QuickSort( unsigned long int SortVals[MAXMOVES],struct move2 movelist[MAXMOVES], int inf, int sup);
bool is_prime(long n);
int make_prime(int n);

/*----------> globals  */

int *play;
U64 ZobristNumbers[47][17];
unsigned int HASHTABLESIZE = 4000037;   // 199999 is prime number, this is default size
struct TEntry *TTable;
int realdepth;
int nodes;
struct move2 bestrootmove;

/* KestoG search timeout */
#include <time.h>
#define clock() wall_clock()
static clock_t wall_clock(void){ struct timespec ts; clock_gettime(CLOCK_MONOTONIC,&ts); return (clock_t)((long long)ts.tv_sec*1000000LL + ts.tv_nsec/1000); }
#undef CLOCKS_PER_SEC
#define CLOCKS_PER_SEC 1000000
clock_t search_deadline;
volatile int search_timeout = 0;
unsigned long int History[46][46];
int killersf[MAXDEPTH*32+2];
int killerst[MAXDEPTH*32+2];
int killersf2[MAXDEPTH*32+2];
int killerst2[MAXDEPTH*32+2];
int G_index;
U32 G_lock;


#pragma warn -8057
#pragma warn -8004

/*    dll stuff                  */
//bool WINAPI
//DllEntryPoint (HANDLE hDLL, DWORD dwReason, LPVOID lpReserved)
//{
//  /* in a dll you used to have LibMain instead of WinMain in
//     windows programs, or main in normal C programs win32
//     replaces LibMain with DllEntryPoint. */
//
//  switch (dwReason)
//    {
//    case DLL_PROCESS_ATTACH:
//      /* dll loaded. put initializations here! */
//      break;
//    case DLL_PROCESS_DETACH:
//      /* program is unloading dll. put clean up here! */
//      break;
//    case DLL_THREAD_ATTACH:
//      break;
//    case DLL_THREAD_DETACH:
//      break;
//    default:
//      break;
//    }
//  return true;
//}


/* CheckerBoard API: enginecommand(), islegal(), getmove() */

int WINAPI
enginecommand (char str[256], char reply[1024])
{
  /* answer to commands sent by CheckerBoard.  This does not
   * answer to some of the commands, eg it has no engine
   * options. */

  char command[256], param1[256], param2[256];
  char *stopstring;
  int nMegs;
  sscanf (str, "%s %s %s", command, param1, param2);

  // check for command keywords

  if (strcmp (command, "name") == 0)
    {
      sprintf (reply, "KestoG variklis v1.1");
      return 1;
    }

  if (strcmp (command, "about") == 0)
    {
  sprintf (reply,"\nKestoG variklis v1.1\n by Kestutis Gasaitis\nEngine which plays Russian checkers\n2005\nE-mail to:kestasl8t@delfi.lt with any comments.");
  return 1;
    }

  if (strcmp (command, "help") == 0)
    {
      sprintf (reply, "missing.htm");
      return 1;
    }

  if (strcmp (command, "set") == 0)
    {
      if (strcmp (param1, "hashsize") == 0)
         {
              nMegs = strtol( param2, &stopstring, 10 );
              if (nMegs < 1) return 0;
              if (nMegs > 128) nMegs = 128;
              HASHTABLESIZE = (nMegs-2) * ((int)1048576 / sizeof( struct TEntry));
              HASHTABLESIZE = make_prime(HASHTABLESIZE);
              return 1;
          }
     if (strcmp (param1, "book") == 0)
	{
	  return 0;
	}
    }

  if (strcmp (command, "get") == 0)
    {
      if (strcmp (param1, "hashsize") == 0)
	{
                    sprintf (reply, "%lu", HASHTABLESIZE / (1048576 / sizeof( struct TEntry)));
	  return 1;
	}
      if (strcmp (param1, "book") == 0)
	{
	  return 0;
	}
      if (strcmp (param1, "protocolversion") == 0)
	{
	  sprintf (reply, "2");
	  return 1;
	}
      if (strcmp (param1, "gametype") == 0)
	{
	  sprintf (reply, "25");
	  return 1;
	}
    }
    strcpy (reply, "?");
  return 0;
}


int WINAPI
islegal (int b[8][8], int color, int from, int to,struct CBmove *move)
{
  /* islegal tells CheckerBoard if a move the user wants to
   * make is legal or not. to check this, we generate a
   * movelist and compare the moves in the movelist to the
   * move the user wants to make with from & to */

    int n,i,found=0,Lfrom,Lto;
    struct move2 movelist[MAXMOVES];
    int board[46];
    int capture;
    char Lstr[80];

	/* initialize board */
   for(i=0;i<46;i++)
     board[i]=OCCUPIED;
   for(i=5;i<=40;i++)
     board[i]=FREE;
       board[5]=b[0][0];board[6]=b[2][0];board[7]=b[4][0];board[8]=b[6][0];
       board[10]=b[1][1];board[11]=b[3][1];board[12]=b[5][1];board[13]=b[7][1];
       board[14]=b[0][2];board[15]=b[2][2];board[16]=b[4][2];board[17]=b[6][2];
       board[19]=b[1][3];board[20]=b[3][3];board[21]=b[5][3];board[22]=b[7][3];
       board[23]=b[0][4];board[24]=b[2][4];board[25]=b[4][4];board[26]=b[6][4];
       board[28]=b[1][5];board[29]=b[3][5];board[30]=b[5][5];board[31]=b[7][5];
       board[32]=b[0][6];board[33]=b[2][6];board[34]=b[4][6];board[35]=b[6][6];
       board[37]=b[1][7];board[38]=b[3][7];board[39]=b[5][7];board[40]=b[7][7];
   for(i=5;i<=40;i++)
     if(board[i] == 0) board[i]=FREE;
   for(i=9;i<=36;i+=9)
     board[i]=OCCUPIED;
	/* board initialized */

     n = Gen_Captures( board,movelist , color );
     capture=n;

     if (!n)
     n = Gen_Moves( board,movelist , color );
     if (!n) return 0;

     /* now we have a movelist - check if from and to are the same */
    for(i=0;i<n;i++)
      {
                     movetonotation(movelist[i],Lstr);
                     if ( capture )
                        sscanf(Lstr,"%i%*c%i",&Lfrom,&Lto);
                    else
                        sscanf(Lstr,"%i%*c%i",&Lfrom,&Lto);

                    if(from==Lfrom && to==Lto)
			{
			found=1;
			break;
			}
      }
      if(found) {
      /* sets GCBmove to movelist[i] */
       setbestmove(movelist[i]);

        }
  *move=GCBmove;
  return found;
	}


int WINAPI
getmove (int board[8][8],int color,double maxtime,char str[1024],int *playnow,int info,int unused,struct CBmove *move)
{
  /* getmove is what checkerboard calls. you get the parameters:

     - b[8][8]
     is the current position. the values in the array are
     determined by the #defined values of BLACK, WHITE, KING,
     MAN. a black king for instance is represented by BLACK|KING.

     - color
     is the side to make a move. BLACK or WHITE.

     - maxtime
     is the time your program should use to make a move. this
     is what you specify as level in checkerboard. so if you
     exceed this time it's not too bad - just don't exceed it
     too much...

     - str
     is a pointer to the output string of the checkerboard status bar.
     you can use sprintf(str,"information"); to print any information you
     want into the status bar.

     - *playnow
     is a pointer to the playnow variable of checkerboard. if
     the user would like your engine to play immediately, this
     value is nonzero, else zero. you should respond to a
     nonzero value of *playnow by interrupting your search
     IMMEDIATELY.

     - CBmove
     tells checkerboard what your move is, see above.
   */

   int i;
   int value;
   int b[46];
   int time = (int)(maxtime * 1000.0);
   { static int hf_done = 0; if (!hf_done) { Create_HashFunction(); hf_done = 1; } }
   /* initialize board */
   for(i=0;i<46;i++)
     b[i]=OCCUPIED;
   for(i=5;i<=40;i++)
     b[i]=FREE;
          /*    (white)
                37  38  39  40
              32  33  34  35
                28  29  30  31
              23  24  25  26
                19  20  21  22
              14  15  16  17
                10  11  12  13
               5   6   7   8
         (black)   */
     b[5]=board[0][0];b[6]=board[2][0];b[7]=board[4][0];b[8]=board[6][0];
     b[10]=board[1][1];b[11]=board[3][1];b[12]=board[5][1];b[13]=board[7][1];
     b[14]=board[0][2];b[15]=board[2][2];b[16]=board[4][2];b[17]=board[6][2];
     b[19]=board[1][3];b[20]=board[3][3];b[21]=board[5][3];b[22]=board[7][3];
     b[23]=board[0][4];b[24]=board[2][4];b[25]=board[4][4];b[26]=board[6][4];
     b[28]=board[1][5];b[29]=board[3][5];b[30]=board[5][5];b[31]=board[7][5];
     b[32]=board[0][6];b[33]=board[2][6];b[34]=board[4][6];b[35]=board[6][6];
     b[37]=board[1][7];b[38]=board[3][7];b[39]=board[5][7];b[40]=board[7][7];
   for(i=5;i<=40;i++)
       if ( b[i] == 0 ) b[i]=FREE;
   for(i=9;i<=36;i+=9)
       b[i]=OCCUPIED;
   play=playnow;

   value = compute(b, color,time, str);

   for(i=5;i<=40;i++)
       if( b[i] == FREE) b[i]=0;
     /* return the board */
    board[0][0]=b[5];board[2][0]=b[6];board[4][0]=b[7];board[6][0]=b[8];
    board[1][1]=b[10];board[3][1]=b[11];board[5][1]=b[12];board[7][1]=b[13];
    board[0][2]=b[14];board[2][2]=b[15];board[4][2]=b[16];board[6][2]=b[17];
    board[1][3]=b[19];board[3][3]=b[20];board[5][3]=b[21];board[7][3]=b[22];
    board[0][4]=b[23];board[2][4]=b[24];board[4][4]=b[25];board[6][4]=b[26];
    board[1][5]=b[28];board[3][5]=b[29];board[5][5]=b[30];board[7][5]=b[31];
    board[0][6]=b[32];board[2][6]=b[33];board[4][6]=b[34];board[6][6]=b[35];
    board[1][7]=b[37];board[3][7]=b[38];board[5][7]=b[39];board[7][7]=b[40];

	/* set the move */
  *move=GCBmove;
   if(color==BLACK)
   	{
   	if(value>4000) return WIN;
   	if(value<-4000) return LOSS;
   	}
   if(color==WHITE)
   	{
      if(value>4000) return LOSS;
      if(value<-4000) return WIN;
      }

  return UNKNOWN;
}


void black_king_capture( int b[46],  int *n, struct move2 movelist[MAXMOVES], int j)
{
   int m;
   int temp;
   int tmp;
   int capsq;
   int found_cap = 0;
   int found_pd;
   struct move2 move,orgmove;

   orgmove = movelist[*n];

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +4 Move Up and Left                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = j;
found_pd = 0;
do {
 temp = temp + 4;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & WHITE ) != 0 ) {
      capsq = temp;
      temp = temp + 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_13b(b,temp) ) {
             // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (BLACK|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_pd = 1;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             black_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
                                                  }
          temp = temp + 4;
      }
      if ( !found_pd ) {
       temp = capsq;
       temp = temp +4;
      while ( ( b[temp] & FREE ) != 0 )
      {
        // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (BLACK|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             black_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
       temp = temp + 4;
      }
                        }

} // End for direction


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   +5 Move Up and Right                                                                             //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = j;
found_pd = 0;
do {
 temp = temp + 5;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & WHITE ) != 0 ) {
      capsq = temp;
      temp = temp + 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_02b(b,temp) ) {
          // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = ( BLACK|KING ); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_pd = 1;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             black_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
                                                  }
          temp = temp + 5;
      }
      if ( !found_pd ) {
       temp = capsq;
       temp = temp +5;
      while ( ( b[temp] & FREE ) != 0 )
      {
           // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = ( BLACK|KING ); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             black_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
         temp = temp + 5;
      }
                        }
} // End for direction


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -4 Move Down and Right                                                                                //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = j;
found_pd = 0;
do {
 temp = temp - 4;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & WHITE ) != 0 ) {
      capsq = temp;
      temp = temp - 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_13b(b,temp) ) {
          // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (BLACK|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_pd = 1;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             black_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
                              }
          temp = temp - 4;
     }
      if ( !found_pd ) {
       temp = capsq;
       temp = temp - 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
           // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (BLACK|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             black_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
      temp = temp - 4;
      }
                        }
} // End for direction


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -5 Move Down and Left                                                                               //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = j;
found_pd = 0;
do {
 temp = temp - 5;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & WHITE ) != 0 ) {
      capsq = temp;
      temp = temp - 5;
      
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_02b(b,temp) ) {
          // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (BLACK|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_pd = 1;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             black_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
          }
          temp = temp - 5;
      }
      
      if ( !found_pd ) {
       temp = capsq;
       temp = temp - 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
           // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (BLACK|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             black_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
          temp = temp - 5;
      }
   }
}  // End for direction

if ( !found_cap ) (*n)++;
}


void black_man_capture( int b[46],  int *n,struct move2 movelist[MAXMOVES] ,int j) {
   int m;
   int temp;
   int tmp;
   int found_cap = 0;
   struct move2 move,orgmove;
   orgmove = movelist[*n];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +4 Capture Up and Left                                                                           //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (  ( b[j + 4] & WHITE ) != 0 )
 {
   if ( ( b[j + 8] & FREE ) != 0 )
    {
       // Add to move list
       move = orgmove;
       move.l++;
       move.path[move.l - 2] = (j + 8);
       m = b[j + 4];m = m<<8;
       m+=(j + 4);
       move.m[move.l - 1] = m;
       if ( j >= 28 ){
        m = (BLACK|KING);
        m = m<<8;
        m+=(j + 8);
        move.m[1] = m;
        found_cap = 1;
        movelist[*n] = move;
        tmp = b[j + 4];
        b[j + 4] = OCCUPIED;
        black_king_capture(b, n, movelist,j + 8);
        b[j + 4] = tmp;
           }
       else {
        m = (BLACK|MAN);
        m = m<<8;
        m+=(j + 8);
        move.m[1] = m;
        found_cap = 1;
        movelist[*n] = move;
        tmp = b[j + 4];
        b[j + 4] = OCCUPIED;
        black_man_capture(b, n, movelist,j + 8);
        b[j + 4] = tmp;
           }
       }
   }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +5 Capture Up and Right                                                                           //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[j + 5] & WHITE ) != 0 )
 {
   if ( ( b[j + 10] & FREE ) != 0 )
    {
       // Add to move list
       move = orgmove;
       move.l++;
       move.path[move.l - 2] = (j + 10);
       m = b[j + 5];m = m<<8;
       m+=(j + 5);
       move.m[move.l - 1] = m;
     if ( j >= 28 ){
        m = (BLACK|KING);
        m = m<<8;
        m+=(j + 10);
        move.m[1] = m;
        found_cap = 1;
        movelist[*n] = move;
        tmp = b[j + 5];
        b[j + 5] = OCCUPIED;
        black_king_capture(b, n, movelist,j + 10);
        b[j + 5] = tmp;
           }
       else {
        m = (BLACK|MAN);
        m = m<<8;
        m+=(j + 10);
        move.m[1] = m;
        found_cap = 1;
        movelist[*n] = move;
        tmp = b[j + 5];
        b[j + 5] = OCCUPIED;
        black_man_capture(b, n, movelist,j + 10);
        b[j + 5] = tmp;
           }
       }
   }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -4 Capture Down and Right                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[j - 4] & WHITE ) != 0 )
 {
   if ( ( b[j - 8] & FREE ) != 0 )
    {
       // Add to move list
       move = orgmove;
       move.l++;
       move.path[move.l - 2] = (j - 8);
       m = (BLACK|MAN); m = m<<8;
       m+=(j - 8);
       move.m[1] = m;
       m = b[j - 4];m = m<<8;
       m+=(j - 4);
       move.m[move.l - 1] = m;
       found_cap = 1;
       movelist[*n] = move;
       tmp = b[j - 4];
       b[j - 4] = OCCUPIED;
       black_man_capture(b, n, movelist,j - 8);
       b[j - 4] = tmp;
                          }
               }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -5 Capture Down and Left                                                                           //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[j - 5] & WHITE ) != 0 )
 {
   if ( ( b[j - 10] & FREE ) != 0 )
    {
       // Add to move list
       move = orgmove;
       move.l++;
       move.path[move.l - 2] = (j - 10);
       m = (BLACK|MAN); m = m<<8;
       m+=(j - 10);
       move.m[1] = m;
       m=b[j - 5];m = m<<8;
       m+=(j - 5);
       move.m[move.l - 1] = m;
       found_cap = 1;
       movelist[*n] = move;
       tmp = b[j - 5];
       b[j - 5] = OCCUPIED;
       black_man_capture(b, n, movelist,j - 10);
       b[j - 5] = tmp;
                          }
               }
if ( !found_cap ) (*n)++;
}


void white_king_capture( int b[46],  int *n, struct move2 movelist[MAXMOVES] , int j) {
   int m;
   int temp;
   int tmp;
   int capsq;
   int found_cap = 0;
   int found_pd;
   struct move2 move,orgmove;

   orgmove = movelist[*n];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +4 Capture Up and Left                                                                           //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = j;
found_pd = 0;
do {
 temp = temp + 4;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & BLACK ) != 0 ) {
      capsq = temp;
      temp = temp + 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_13w(b,temp) ) {
            // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (WHITE|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_pd = 1;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             white_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
                                         }
          temp = temp + 4;
      }
      if ( !found_pd ) {
       temp = capsq;
       temp = temp +4;
      while ( ( b[temp] & FREE ) != 0 )
      {
             // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (WHITE|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             white_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
       temp = temp + 4;
     }
                  }
} // End for direction


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   +5 Move Up and Right                                                                             //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = j;
found_pd = 0;
do {
 temp = temp + 5;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & BLACK ) != 0 ) {
      capsq = temp;
      temp = temp + 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_02w(b,temp) ) {
             // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (WHITE|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_pd = 1;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             white_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
                                             }
          temp = temp + 5;
      }
      if ( !found_pd ) {
       temp = capsq;
       temp = temp +5;
      while ( ( b[temp] & FREE ) != 0 )
      {
             // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (WHITE|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             white_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
       temp = temp + 5;
      }
                 }
} // End for direction


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -4 Move Down and Right                                                                                //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = j;
found_pd = 0;
do {
 temp = temp - 4;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & BLACK ) != 0 ) {
      capsq = temp;
      temp = temp - 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_13w(b,temp) ) {
             // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (WHITE|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_pd = 1;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             white_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
                             }
          temp = temp - 4;
      }
      if ( !found_pd ) {
       temp = capsq;
       temp = temp - 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
             // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (WHITE|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             white_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
      temp = temp - 4;
      }
               }
} // End for direction


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -5 Move Down and Left                                                                               //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = j;
found_pd = 0;
do {
 temp = temp - 5;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & BLACK ) != 0 ) {
      capsq = temp;
      temp = temp - 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_02w(b,temp) ) {
             // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (WHITE|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_pd = 1;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             white_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
                                                }
          temp = temp - 5;
      }
      if ( !found_pd ) {
       temp = capsq;
       temp = temp - 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
             // Add to move list
             move = orgmove;
             move.l++;
             move.path[move.l - 2] = temp;
             m = (WHITE|KING); m = m<<8;
             m+=temp;
             move.m[1] = m;
             m = b[capsq]; m = m<<8;
             m+=capsq;
             move.m[move.l - 1] = m;
             found_cap = 1;
             movelist[*n] = move;
             tmp = b[capsq];
             b[capsq] = OCCUPIED;
             // recursion
             white_king_capture(b, n, movelist, temp);
             b[capsq] = tmp;
          temp = temp - 5;
      }
                        }
}  // End for direction

if ( !found_cap ) (*n)++;
}


void white_man_capture( int b[46],  int *n, struct move2 movelist[MAXMOVES] , int j){
   int m;
   int temp;
   int tmp;
   int found_cap = 0;
   struct move2 move,orgmove;
   orgmove = movelist[*n];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +4 Capture Up and Left                                                                           //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[j + 4] & BLACK ) != 0 )
 {
   if ( ( b[j + 8] & FREE ) != 0 )
    {
       // Add to move list
       move = orgmove;
       move.l++;
       move.path[move.l - 2] = (j + 8);
       m = (WHITE|MAN); m = m<<8;
       m+=(j + 8);
       move.m[1] = m;
       m=b[j + 4];m = m<<8;
       m+=(j + 4);
       move.m[move.l - 1] = m;
       found_cap = 1;
       movelist[*n] = move;
       tmp = b[j + 4];
       b[j + 4] = OCCUPIED;
       white_man_capture(b, n, movelist,j + 8);
       b[j + 4] = tmp;
                          }
               }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +5 Capture Up and Right                                                                           //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[j + 5] & BLACK ) != 0 )
 {
   if ( ( b[j + 10] & FREE ) != 0 )
    {
       // Add to move list
       move = orgmove;
       move.l++;
       move.path[move.l - 2] = (j + 10);
       m = (WHITE|MAN); m = m<<8;
       m+=(j + 10);
       move.m[1] = m;
       m = b[j + 5];m = m<<8;
       m+=(j + 5);
       move.m[move.l - 1] = m;
       found_cap = 1;
       movelist[*n] = move;
       tmp = b[j + 5];
       b[j + 5] = OCCUPIED;
       white_man_capture(b, n, movelist,j + 10);
       b[j + 5] = tmp;
                          }
               }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -4 Capture Down and Right                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[j - 4] & BLACK ) != 0 )
 {
  if ( ( b[j - 8] & FREE ) != 0 )
    {
       // Add to move list
       move = orgmove;
       move.l++;
       move.path[move.l - 2] = (j - 8);
       m = b[j - 4];m = m<<8;
       m+=(j - 4);
       move.m[move.l - 1] = m;
  if ( j <= 17 ){
        m = (WHITE|KING);
        m = m<<8;
        m+=(j - 8);
        move.m[1] = m;
        found_cap = 1;
        movelist[*n] = move;
        tmp = b[j - 4];
        b[j -4] = OCCUPIED;
        white_king_capture(b, n, movelist,j - 8);
        b[j -4] = tmp;
           }
       else {
        m = (WHITE|MAN);
        m = m<<8;
        m+=(j -8);
        move.m[1] = m;
        found_cap = 1;
        movelist[*n] = move;
        tmp = b[j - 4];
        b[j- 4] = OCCUPIED;
        white_man_capture(b, n, movelist,j -8);
        b[j -4] = tmp;
           }
       }
   }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -5 Capture Down and Left                                                                           //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[j - 5] & BLACK ) != 0 )
 {
   if ( ( b[j - 10] & FREE ) != 0 )
    {
       // Add to move list
       move = orgmove;
       move.l++;
       move.path[move.l - 2] = (j - 10);
       m = b[j - 5];m = m<<8;
       m+=(j - 5);
       move.m[move.l - 1] = m;
 if ( j <= 17 ){
        m = (WHITE|KING);
        m = m<<8;
        m+=(j - 10);
        move.m[1] = m;
        found_cap = 1;
        movelist[*n] = move;
        tmp = b[j - 5];
        b[j - 5] = OCCUPIED;
        white_king_capture(b, n, movelist,j - 10);
        b[j - 5] = tmp;
      }
       else {
        m = (WHITE|MAN);
        m = m<<8;
        m+=(j - 10);
        move.m[1] = m;
        found_cap = 1;
        movelist[*n] = move;
        tmp = b[j -5];
        b[j- 5] = OCCUPIED;
        white_man_capture(b, n, movelist,j - 10);
        b[j - 5] = tmp;
           }
       }
   }
if ( !found_cap ) (*n)++;
}


int  Test_From_13b( int b[46], int mloc) {
int sq;

//
sq = mloc;
do {
  sq = sq + 5;
}
while ( ( b[sq] & FREE ) != 0 );
if ( ( b[sq] & WHITE ) != 0 )
  if ( ( b[sq +5] & FREE ) != 0 )
        return (1);
//
sq = mloc;
do {
  sq = sq - 5;
}
while  ( ( b[sq] & FREE ) != 0 );
if ( ( b[sq] & WHITE ) != 0 )
  if ( ( b[sq - 5] & FREE ) != 0 )
        return (1);

return(0);

}

int  Test_From_02b( int b[46], int mloc) {
int sq;

//
sq = mloc;
do {
  sq = sq + 4;
}
while ( ( b[sq] & FREE ) != 0 );
if ( ( b[sq] & WHITE ) != 0 )
  if ( ( b[sq +4] & FREE ) != 0 )
        return (1);
//
sq = mloc;
do {
  sq = sq - 4;
}
while  ( ( b[sq] & FREE ) != 0 );
if ( ( b[sq] & WHITE ) != 0 )
  if ( ( b[sq - 4] & FREE ) != 0 )
        return (1);

return(0);

}

int  Test_From_13w( int b[46], int mloc) {
int sq;

//
sq = mloc;
do {
  sq = sq + 5;
}
while ( ( b[sq] & FREE ) != 0 );
if ( ( b[sq] & BLACK ) != 0 )
  if ( ( b[sq +5] & FREE ) != 0 )
        return (1);
//
sq = mloc;
do {
  sq = sq - 5;
}
while  ( ( b[sq] & FREE ) != 0 );
if ( ( b[sq] & BLACK ) != 0 )
  if ( ( b[sq - 5] & FREE ) != 0 )
        return (1);

return(0);

}

int  Test_From_02w( int b[46], int mloc) {
int sq;

//
sq = mloc;
do {
  sq = sq + 4;
}
while ( ( b[sq] & FREE ) != 0 );
if ( ( b[sq] & BLACK ) != 0 )
  if ( ( b[sq +4] & FREE ) != 0 )
        return (1);
//
sq = mloc;
do {
  sq = sq - 4;
}
while  ( ( b[sq] & FREE ) != 0 );
if ( ( b[sq] & BLACK ) != 0 )
  if ( ( b[sq - 4] & FREE ) != 0 )
        return (1);

return(0);

}


int Gen_Captures( int b[46], struct move2 movelist[MAXMOVES] , int color )
/*------------------------> purpose: generate all possible captures.
   ------------------------> returns: number of captures.
*/

 {
  int n = 0;           // move number
  int m;                // auxiliary variable
  int square;         // loop counter
  int tmp;
  int temp;
  int capsq;           // captured square
  int found_pd;     // found perpendicular direction to current direction

if ( color == BLACK )
 {
 for ( square=5; square <= 40;square++ )
 {
    if ( (b[square] & BLACK ) != 0 )
       {
       if ( (b[square] & MAN ) != 0 )
        {
          b[square] = FREE;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +4 Capture Up and Left                                                                             //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[square + 4] & WHITE ) != 0 )
 {
   if ( ( b[square + 8] & FREE ) != 0 )
    {
       // Add to move list
       movelist[n].l = 3;
       movelist[n].path[1] = (square + 8);
       m = (BLACK|MAN); m = m<<8;
       m+=square;
       movelist[n].m[0] = m;
       m = b[square+4];m = m<<8;
       m+=(square+4);
       movelist[n].m[2] = m;
       if ( square >= 28 ) {
        m = (BLACK|KING);m = m<<8;
        m+=(square+8);
        movelist[n].m[1] = m;
        tmp = b[square+4];
        b[square+4] = OCCUPIED;
        black_king_capture(b, &n, movelist,square+8);
        b[square+4] = tmp;
        }
       else
       {
         m = (BLACK|MAN);m = m<<8;
         m+=(square+8);
         movelist[n].m[1] = m;
         tmp = b[square+4];
         b[square+4] = OCCUPIED;
         black_man_capture(b, &n, movelist,square+8);
         b[square+4] = tmp;
        }
                  }
            }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +5 Capture Up and Right                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( ( b[square + 5] & WHITE ) != 0 )
 {
   if ( ( b[square + 10] & FREE ) != 0 )
    {
       // Add to move list
       movelist[n].l = 3;
       movelist[n].path[1] = (square + 10);
       m = (BLACK|MAN); m = m<<8;
       m+=square;
       movelist[n].m[0] = m;
       m = b[square+5];m = m<<8;
       m+=(square+5);
       movelist[n].m[2] = m;
       if ( square >= 28 ) {
        m = (BLACK|KING);m = m<<8;
        m+=(square+10);
        movelist[n].m[1] = m;
        tmp = b[square+5];
        b[square+5] = OCCUPIED;
        black_king_capture(b, &n, movelist,square+10);
        b[square+5] = tmp;
                                  }
      else
      {
        m = (BLACK|MAN);m = m<<8;
        m+=(square+10);
        movelist[n].m[1] = m;
        tmp = b[square+5];
        b[square+5] = OCCUPIED;
        black_man_capture(b, &n, movelist,square+10);
        b[square+5] = tmp;
        }
                 }
            }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -4 Capture Down and Right                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (  ( b[square - 4] & WHITE ) != 0 )
 {
   if ( ( b[square - 8] & FREE ) != 0 )
    {
       // Add to move list
       movelist[n].l = 3;
       movelist[n].path[1] = (square - 8);
       m = (BLACK|MAN);m = m<<8;
       m+=(square - 8);
       movelist[n].m[1] = m;
       m = (BLACK|MAN); m = m<<8;
       m+=square;
       movelist[n].m[0] = m;
       m = b[square - 4];m = m<<8;
       m+=(square - 4);
       movelist[n].m[2] = m;
       tmp = b[square - 4];
       b[square - 4] = OCCUPIED;
       black_man_capture(b, &n, movelist,square - 8);
       b[square - 4] = tmp;
                     }
            }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -5 Capture Down and Left                                                                          //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (  ( b[square - 5] & WHITE ) != 0 )
 {
   if ( ( b[square - 10] & FREE ) != 0 )
    {
       // Add to move list
       movelist[n].l = 3;
       movelist[n].path[1] = (square - 10);
       m = (BLACK|MAN);m = m<<8;
       m+=(square - 10);
       movelist[n].m[1] = m;
       m = (BLACK|MAN); m = m<<8;
       m+=square;
       movelist[n].m[0] = m;
       m = b[square - 5];m = m<<8;
       m+=(square - 5);
       movelist[n].m[2] = m;
       tmp = b[square - 5];
       b[square - 5] = OCCUPIED;
       black_man_capture(b, &n, movelist,square - 10);
       b[square - 5] = tmp;
                     }
            }
        b[square] = (BLACK|MAN);
        } // if MAN

if ( ( b[square] & KING ) != 0 )        /*  or else         */
{
      b[square] = FREE;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +4 Capture Up and Left                                                                             //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = square;
found_pd = 0;
do {
 temp = temp + 4;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & WHITE ) != 0 ) {
      capsq = temp;
      temp = temp + 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_13b(b,temp) ) {
              found_pd = 1;
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (BLACK|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (BLACK|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
               // further
               black_king_capture(b, &n, movelist,temp);
               b[capsq] = tmp;
                                            } // if
         temp = temp + 4;
      } // while

      if ( !found_pd ) {
       temp = capsq;
       temp = temp +4;
      while ( ( b[temp] & FREE ) != 0 )
      {
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (BLACK|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
               m = (BLACK|KING); m = m<<8;
               m+=square;
               movelist[n].m[0] = m;
               m = b[capsq];m = m<<8;
               m+=capsq;
               movelist[n].m[2] = m;
               tmp = b[capsq];
               b[capsq] = OCCUPIED;
               // further
               black_king_capture(b, &n, movelist,temp);
               b[capsq] = tmp;
     temp = temp + 4;
     } // while
              } // if
  } // End for direction


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +5 Capture Up and Right                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = square;
found_pd = 0;
do {
 temp = temp + 5;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & WHITE ) != 0 ) {
      capsq = temp;
      temp = temp + 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_02b(b,temp) ) {
              found_pd = 1;
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (BLACK|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (BLACK|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
               tmp = b[capsq];
               b[capsq] = OCCUPIED;
               // further
               black_king_capture(b, &n, movelist,temp);
               b[capsq] = tmp;
                                           } // if
               temp = temp + 5;
                        } // while
       if ( !found_pd ) {
       temp = capsq;
       temp = temp +5;
      while ( ( b[temp] & FREE ) != 0 )
      {
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (BLACK|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
               m = (BLACK|KING); m = m<<8;
               m+=square;
               movelist[n].m[0] = m;
               m = b[capsq];m = m<<8;
               m+=capsq;
               movelist[n].m[2] = m;
               tmp = b[capsq];
               b[capsq] = OCCUPIED;
               // further
               black_king_capture(b, &n, movelist,temp);
               b[capsq] = tmp;
      temp = temp + 5;
      } // while
                        } // if
 } // End for direction


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -4 Capture Down and Right                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = square;
found_pd = 0;
do {
 temp = temp - 4;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & WHITE ) != 0 ) {
      capsq = temp;
      temp = temp - 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_13b(b,temp) ) {
              found_pd = 1;
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (BLACK|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
               m = (BLACK|KING); m = m<<8;
               m+=square;
               movelist[n].m[0] = m;
               m = b[capsq];m = m<<8;
               m+=capsq;
               movelist[n].m[2] = m;
               tmp = b[capsq];
               b[capsq] = OCCUPIED;
               black_king_capture(b, &n, movelist,temp);
               b[capsq] = tmp;
                                         } // if
               temp = temp - 4;
                  } // while
      if ( !found_pd ) {
       temp = capsq;
       temp = temp - 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (BLACK|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (BLACK|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
               // further
               black_king_capture(b, &n, movelist,temp);
               b[capsq] = tmp;
      temp = temp - 4;
       } // while
               } // if
 } // End for direction


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// -5 Capture Down and Left                                                                                   //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = square;
found_pd = 0;
do {
 temp = temp - 5;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & WHITE ) != 0 ) {
      capsq = temp;
      temp = temp - 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_02b(b,temp) ) {
              found_pd = 1;
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (BLACK|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (BLACK|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
               // further
               black_king_capture(b, &n, movelist,temp);
               b[capsq] = tmp;
                               } // if
          temp = temp - 5;
    } // while
      if ( !found_pd ) {
       temp = capsq;
       temp = temp - 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (BLACK|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (BLACK|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
               // further
               black_king_capture(b, &n, movelist,temp);
               b[capsq] = tmp;
       temp = temp - 5;
      } // while
                      } // if
  } // End for direction
     b[square] = (BLACK|KING);
 } // if KING
} // BLACK
                 } // for
} // color


if ( color == WHITE ) {
 for ( square=5; square <= 40;square++ )
  {
    if ( ( b[square] & WHITE ) != 0 )
      {
          if ( ( b[square] & MAN ) != 0 )
           {
              b[square] = FREE;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +4 Capture Up and Left                                                                             //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (  ( b[square + 4] & BLACK ) != 0 )
 {
   if ( ( b[square + 8] & FREE ) != 0 )
    {
       // Add to move list
       movelist[n].l = 3;
       movelist[n].path[1] = (square + 8);
       m = (WHITE|MAN);m = m<<8;
       m+=(square + 8);
       movelist[n].m[1] = m;
       m = (WHITE|MAN); m = m<<8;
       m+=square;
       movelist[n].m[0] = m;
       m = b[square + 4];m = m<<8;
       m+=(square + 4);
       movelist[n].m[2] = m;
       tmp = b[square + 4];
       b[square + 4] = OCCUPIED;
       white_man_capture(b, &n, movelist,square + 8);
       b[square + 4] = tmp;
                }
            }


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +5 Capture Up and Right                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (  ( b[square + 5] & BLACK ) != 0 )
 {
   if ( ( b[square + 10] & FREE ) != 0 )
    {
       // Add to move list
       movelist[n].l = 3;
       movelist[n].path[1] = (square + 10);
       m = (WHITE|MAN);m = m<<8;
       m+=(square + 10);
       movelist[n].m[1] = m;
       m = (WHITE|MAN); m = m<<8;
       m+=square;
       movelist[n].m[0] = m;
       m = b[square + 5];m = m<<8;
       m+=(square + 5);
       movelist[n].m[2] = m;
       tmp = b[square + 5];
       b[square + 5] = OCCUPIED;
       white_man_capture(b, &n, movelist,square + 10);
       b[square + 5] = tmp;
                     }
            }


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -4 Capture Down and Right                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (  ( b[square - 4] & BLACK ) != 0 )
 {
   if ( ( b[square - 8] & FREE ) != 0 )
    {
       // Add to move list
       movelist[n].l = 3;
       movelist[n].path[1] = (square - 8);
       m = (WHITE|MAN); m = m<<8;
       m+=square;
       movelist[n].m[0] = m;
       m = b[square - 4];m = m<<8;
       m+=(square - 4);
       movelist[n].m[2] = m;
       if ( square <= 17 ) {
       m = (WHITE|KING);m = m<<8;
       m+=(square - 8);
       movelist[n].m[1] = m;
       tmp = b[square - 4];
       b[square - 4] = OCCUPIED;
       white_king_capture(b, &n, movelist,square - 8);
       b[square - 4] = tmp;
       }
       else {
        m = (WHITE|MAN);m = m<<8;
        m+=(square - 8);
        movelist[n].m[1] = m;

        tmp = b[square - 4];
        b[square - 4] = OCCUPIED;
        white_man_capture(b, &n, movelist,square - 8);
        b[square - 4] = tmp;
  }
                  }
        }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -5 Capture Down and Left                                                                          //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (  ( b[square - 5] & BLACK ) != 0 )
 {
   if ( ( b[square - 10] & FREE ) != 0 )
    {
       // Add to move list
       movelist[n].l = 3;
       movelist[n].path[1] = (square - 10);
       m = (WHITE|MAN); m = m<<8;
       m+=square;
       movelist[n].m[0] = m;
       m = b[square - 5];m = m<<8;
       m+=(square - 5);
       movelist[n].m[2] = m;
       if ( square <= 17 ) {
        m = (WHITE|KING);m = m<<8;
        m+=(square - 10);
        movelist[n].m[1] = m;
        tmp = b[square - 5];
        b[square - 5] = OCCUPIED;
        white_king_capture(b, &n, movelist,square - 10);
        b[square - 5] = tmp;
        }
       else {
        m = (WHITE|MAN);m = m<<8;
        m+=(square - 10);
        movelist[n].m[1] = m;
        tmp = b[square - 5];
        b[square - 5] = OCCUPIED;
        white_man_capture(b, &n, movelist,square - 10);
        b[square - 5] = tmp;
        }
                  }
            }
        b[square] = (WHITE|MAN);
        }    // if MAN

if ( ( b[square] & KING ) != 0 )     /*     or else        */
      {
      b[square] = FREE;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +4 Capture Up and Left                                                                             //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = square;
found_pd = 0;
do {
 temp = temp + 4;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & BLACK ) != 0 ) {
      capsq = temp;
      temp = temp + 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_13w(b,temp) ) {
              found_pd = 1;
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (WHITE|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (WHITE|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
              // further
              white_king_capture(b, &n, movelist,temp);
              b[capsq] = tmp;
                     } // if
          temp = temp + 4;
      } // while
      if ( !found_pd ) {
       temp = capsq;
       temp = temp +4;
      while ( ( b[temp] & FREE ) != 0 )
      {
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (WHITE|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (WHITE|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
              // further
              white_king_capture(b, &n, movelist,temp);
              b[capsq] = tmp;
      temp = temp + 4;
      } // while
                } // if
  } // End for direction


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  +5 Capture Up and Right                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = square;
found_pd = 0;
do {
 temp = temp + 5;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & BLACK ) != 0 ) {
      capsq = temp;
      temp = temp + 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_02w(b,temp) ) {
              found_pd = 1;
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (WHITE|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (WHITE|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
              // further
              white_king_capture(b, &n, movelist,temp);
              b[capsq] = tmp;
                                    } // if
              temp = temp + 5;
                   } // while
       if ( !found_pd ) {
       temp = capsq;
       temp = temp +5;
      while ( ( b[temp] & FREE ) != 0 )
      {
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (WHITE|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (WHITE|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
              // further
              white_king_capture(b, &n, movelist,temp);
              b[capsq] = tmp;
     temp = temp + 5;
     } // while
                } // if
 } // End for direction


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  -4 Capture Down and Right                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = square;
found_pd = 0;
do {
 temp = temp - 4;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & BLACK ) != 0 ) {
      capsq = temp;
      temp = temp - 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_13w(b,temp) ) {
              found_pd = 1;
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (WHITE|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (WHITE|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
              // further
              white_king_capture(b, &n, movelist,temp);
              b[capsq] = tmp;
                                } // if
               temp = temp - 4;
                 } // while
      if ( !found_pd ) {
       temp = capsq;
       temp = temp - 4;
      while ( ( b[temp] & FREE ) != 0 )
      {
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (WHITE|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (WHITE|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
              // further
              white_king_capture(b, &n, movelist,temp);
              b[capsq] = tmp;
    temp = temp - 4;
        } // while
                        } // if
 } // End for direction


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// -5 Capture Down and Left                                                                                   //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
temp = square;
found_pd = 0;
do {
 temp = temp - 5;
}
while ( ( b[temp] & FREE ) != 0 );

if ( ( b[temp] & BLACK ) != 0 ) {
      capsq = temp;
      temp = temp - 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
          if ( Test_From_02w(b,temp) ) {
              found_pd = 1;
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (WHITE|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (WHITE|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
              // further
              white_king_capture(b, &n, movelist,temp);
              b[capsq] = tmp;
                                   } // if
        temp = temp - 5;
      } // while
      if ( !found_pd ) {
       temp = capsq;
       temp = temp - 5;
      while ( ( b[temp] & FREE ) != 0 )
      {
              // Add to move list
              movelist[n].l = 3;
              movelist[n].path[1] = temp;
              m = (WHITE|KING); m = m<<8;
              m+=temp;
              movelist[n].m[1] = m;
              m = (WHITE|KING); m = m<<8;
              m+=square;
              movelist[n].m[0] = m;
              m = b[capsq];m = m<<8;
              m+=capsq;
              movelist[n].m[2] = m;
              tmp = b[capsq];
              b[capsq] = OCCUPIED;
              // further
              white_king_capture(b, &n, movelist,temp);
              b[capsq] = tmp;
      temp = temp - 5;
      } // while
                  } // if
  } // End for direction
      b[square] = (WHITE|KING);
         } // if KING
  } // if WHITE
                                         } // for
} // color

return (n);  // returns number of captures n
}


int Gen_Moves( int b[46], struct move2 movelist[MAXMOVES] , int color )
{
   int n = 0,m;
   int i;
   int temp;

if ( color == BLACK )
{
    for ( i=5;i<=40;i++)
    {
           if ( ( b[i] & BLACK ) != 0 )
              {
              	if ( ( b[i] & MAN ) != 0 )
              	   {
                       ///////////////////////////////////////////////////////////
                       // +4 Move Up and Left                     //
                       ///////////////////////////////////////////////////////////
                       if ( ( b[i+4] & FREE ) != 0 )
                        {
                        movelist[n].l = 2;
                        if ( i >=32 ) m=(BLACK|KING); else m=(BLACK|MAN); m = m<<8;
                        m+=(i+4);
                        movelist[n].m[1] = m;
                        m=(BLACK|MAN);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        }
                        ///////////////////////////////////////////////////////////
                        // +5 Move Up and Right                   //
                        ///////////////////////////////////////////////////////////
                        if ( ( b[i+5] & FREE ) != 0 )
                        {
                        movelist[n].l = 2;
                        if ( i >=32 ) m=(BLACK|KING); else m=(BLACK|MAN); m = m<<8;
                        m+=(i+5);
                        movelist[n].m[1] = m;
                        m=(BLACK|MAN);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        }
                      } // MAN
                 if ( (  b[i] & KING ) != 0 )   /*    or else    */
                      {
                        ///////////////////////////////////////////////////////////////
                        // +4 Move Up and Left                         //
                       /////////////////////////////////////////////////////////////////
                       temp = i;
                       temp = temp + 4;
                       while  ( ( b[temp] & FREE ) != 0 ) {
                        movelist[n].l = 2;
                        m = (BLACK|KING); m = m<<8;
                        m+=temp;
                        movelist[n].m[1] = m;
                        m = (BLACK|KING);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        temp = temp + 4;
                           } // while
                        /////////////////////////////////////////////////////////////////
                        // +5 Move Up and Right                         //
                        //////////////////////////////////////////////////////////////////
                       temp = i;
                       temp = temp + 5;
                       while  ( ( b[temp] & FREE ) != 0 ) {
                        movelist[n].l = 2;
                        m = (BLACK|KING); m = m<<8;
                        m+=temp;
                        movelist[n].m[1] = m;
                        m = (BLACK|KING);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        temp = temp + 5;
                           } // while
                        ////////////////////////////////////////////////////////////////////
                        // -4 Move Down and Right                        //
                       //////////////////////////////////////////////////////////////////////
                       temp = i;
                       temp = temp - 4;
                       while  ( ( b[temp] & FREE ) != 0 ) {
                        movelist[n].l = 2;
                        m=(BLACK|KING); m = m<<8;
                        m+=temp;
                        movelist[n].m[1] = m;
                        m=(BLACK|KING);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        temp = temp - 4;
                           } // while
                       /////////////////////////////////////////////////////////////////////////
                       // -5 Move Down and Left                               //
                       //////////////////////////////////////////////////////////////////////////
                       temp = i;
                       temp = temp - 5;
                       while  ( ( b[temp] & FREE ) != 0 ) {
                        movelist[n].l = 2;
                        m=(BLACK|KING); m = m<<8;
                        m+=temp;
                        movelist[n].m[1] = m;
                        m=(BLACK|KING);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        temp = temp - 5;
                     } // while
          }  // KING
    }
   } // for
} // color == BLACK

if ( color == WHITE )
{
    for ( i=5;i<=40;i++)
    {
           if ( ( b[i] & WHITE ) != 0 )
              {
              	if ( ( b[i] & MAN ) != 0 )
              	   {
                        ////////////////////////////////////////////////////////////////////////
                        // -4 Move Down and Right                            //
                        ////////////////////////////////////////////////////////////////////////
                        if ( ( b[i-4] & FREE ) != 0 )
                        {
                        movelist[n].l = 2;
                        if ( i <=13 ) m=(WHITE|KING); else m=(WHITE|MAN); m = m<<8;
                        m+=(i-4);
                        movelist[n].m[1] = m;
                        m=(WHITE|MAN);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        }
                        ///////////////////////////////////////////////////////////////////////////
                        // -5 Move Down and Left                                 //
                        ///////////////////////////////////////////////////////////////////////////
                        if ( ( b[i-5] & FREE ) != 0 )
                        {
                        movelist[n].l = 2;
                        if ( i <=13 ) m=(WHITE|KING); else m=(WHITE|MAN); m = m<<8;
                        m+=(i-5);
                        movelist[n].m[1] = m;
                        m=(WHITE|MAN);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        }
                      } // MAN
           if ( (  b[i] & KING ) != 0 )       /*   or else    */
                      {
                        //////////////////////////////////////////////////////////////////////////////////
                        // +4 Move Up and Left                                            //
                        //////////////////////////////////////////////////////////////////////////////////
                       temp = i;
                       temp = temp + 4;
                       while  ( ( b[temp] & FREE ) != 0 ) {
                        movelist[n].l = 2;
                        m=(WHITE|KING); m = m<<8;
                        m+=temp;
                        movelist[n].m[1] = m;
                        m=(WHITE|KING);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        temp = temp + 4;
                           } // while
                        ///////////////////////////////////////////////////////////////////////////////////
                        // +5 Move Up and Right                                           //
                        ///////////////////////////////////////////////////////////////////////////////////
                       temp = i;
                       temp = temp + 5;
                       while  ( ( b[temp] & FREE ) != 0 ) {
                        movelist[n].l = 2;
                        m=(WHITE|KING); m = m<<8;
                        m+=temp;
                        movelist[n].m[1] = m;
                        m=(WHITE|KING);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        temp = temp + 5;
                           } // while
                        /////////////////////////////////////////////////////////////////////////////////////
                        // -4 Move Down and Right                                         //
                        /////////////////////////////////////////////////////////////////////////////////////
                       temp = i;
                       temp = temp - 4;
                       while  ( ( b[temp] & FREE ) != 0 ) {
                        movelist[n].l = 2;
                        m=(WHITE|KING); m = m<<8;
                        m+=temp;
                        movelist[n].m[1] = m;
                        m = (WHITE|KING);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        temp = temp - 4;
                         } // while
                        ///////////////////////////////////////////////////////////////////////////////////////////
                        // -5 Move Down and Left                                                 //
                        ///////////////////////////////////////////////////////////////////////////////////////////
                       temp = i;
                       temp = temp - 5;
                       while  ( ( b[temp] & FREE ) != 0 ) {
                        movelist[n].l = 2;
                        m=(WHITE|KING); m = m<<8;
                        m+=temp;
                        movelist[n].m[1] = m;
                        m=(WHITE|KING);m = m<<8;
                        m+=i;
                        movelist[n].m[0] = m;
                        n++;
                        temp = temp - 5;
                         } // while
                       } // KING
                }
     } // for
} // color == WHITE

return (n); // returns number of moves n
}


void domove(int b[46],struct move2 *move )
/*----> purpose: execute move on board */
{
   int square,after;
   int i;

   square = move->m[0] & 255;
   b[square] = FREE;

   square = move->m[1] & 255;
   after = ( move->m[1] >> 8);
   b[square]=after;

   for(i=2;i<move->l;i++)
	{
      square=(move->m[i] & 255);
      b[square]=FREE;
                   }
   realdepth++;
}


void undomove(int b[46],struct move2 *move )
/*---> purpose: undo what domove did */
{
   int square,before;
   int i;

   square = move->m[1] & 255;
   b[square] = FREE;

   square = move->m[0] & 255;
   before = (move->m[0] >> 8);
   b[square] = before;

   for(i=2;i<move->l;i++)
	{
      square = (move->m[i] & 255);
      before = (move->m[i] >> 8);
      b[square] = before;
                   }
   realdepth--;
}


int evaluation(int b[46], int color)
{
   int i;
   int eval;
   int v1,v2;
   int nbm,nbk,nwm,nwk;
   int nbml,nbkl,nwml,nwkl;  // pieces on left side
   int nbmr,nbkr,nwmr,nwkr;  // pieces on right side

   int code=0;
   static int value[17]={0,0,0,0,0,1,256,0,0,16,4096,0,0,0,0,0,0};
   int backrank;
   const int turn=3;   // color to move gets +turn
   const int brv=3;    // multiplier for back rank

    // count left side pieces
    code+=value[b[5]];
    code+=value[b[6]];
    code+=value[b[10]];
    code+=value[b[11]];
    code+=value[b[14]];
    code+=value[b[15]];
    code+=value[b[19]];
    code+=value[b[20]];
    code+=value[b[23]];
    code+=value[b[24]];
    code+=value[b[28]];
    code+=value[b[29]];
    code+=value[b[32]];
    code+=value[b[33]];
    code+=value[b[37]];
    code+=value[b[38]];

    nwml = code % 16;
    nwkl = (code>>4) % 16;
    nbml = (code>>8) % 16;
    nbkl = (code>>12) % 16;

    code = 0;

    // count right side pieces
    code+=value[b[7]];
    code+=value[b[8]];
    code+=value[b[12]];
    code+=value[b[13]];
    code+=value[b[16]];
    code+=value[b[17]];
    code+=value[b[21]];
    code+=value[b[22]];
    code+=value[b[25]];
    code+=value[b[26]];
    code+=value[b[30]];
    code+=value[b[31]];
    code+=value[b[34]];
    code+=value[b[35]];
    code+=value[b[39]];
    code+=value[b[40]];

    nwmr = code % 16;
    nwkr = (code>>4) % 16;
    nbmr = (code>>8) % 16;
    nbkr = (code>>12) % 16;

    nbm = nbml + nbmr;
    nbk = nbkl + nbkr;
    nwm = nwml + nwmr;
    nwk = nwkl + nwkr;

    v1=200*nbm+500*nbk;
    v2=200*nwm+500*nwk;

   if  ( v1==0 ) return ( color == BLACK) ? ( -MATE+realdepth):(MATE-realdepth);
   if  ( v2==0 ) return ( color == WHITE ) ? (-MATE+realdepth):(MATE-realdepth);

   eval=v1-v2;                       /*material values*/
   eval+=(400*(v1-v2))/(v1+v2);      /*favor exchanges if in material plus*/

   if(color == BLACK) eval+=turn;
   else eval-=turn;
                                           /* balance                */
   eval -= abs( nbml - nbmr )*2;
   eval += abs( nwml - nwmr )*2;

                                            /* king's balance         */
   if  (( nbk == 0 ) && ( nwk != 0 ))
        eval-=500;
   if  (( nbk != 0 ) && ( nwk == 0 ))
        eval+=500;

   code=0;
   if(b[5] & MAN) code++;
   if(b[6] & MAN) code+=2;
   if(b[7] & MAN) code+=4; // Golden checker
   if(b[8] & MAN) code+=8;
   switch (code)
   	{
      case 0: code=0;break;
      case 1: code=-1;break;
      case 2: code=1;break;
      case 3: code=0;break;
      case 4: code=3;break;
      case 5: code=3;break;
      case 6: code=3;break;
      case 7: code=3;break;
      case 8: code=1;break;
      case 9: code=1;break;
      case 10: code=2;break;
      case 11: code=2;break;
      case 12: code=4;break;
      case 13: code=4;break;
      case 14: code=9;break;
      case 15: code=8;break;
      }
   backrank=code;

   code=0;
   if(b[37] & MAN) code+=8;
   if(b[38] & MAN) code+=4; // Golden checker
   if(b[39] & MAN) code+=2;
   if(b[40] & MAN) code++;
   switch (code)
   	{
      case 0: code=0;break;
      case 1: code=-1;break;
      case 2: code=1;break;
      case 3: code=0;break;
      case 4: code=3;break;
      case 5: code=3;break;
      case 6: code=3;break;
      case 7: code=3;break;
      case 8: code=1;break;
      case 9: code=1;break;
      case 10: code=2;break;
      case 11: code=2;break;
      case 12: code=4;break;
      case 13: code=4;break;
      case 14: code=9;break;
      case 15: code=8;break;
      }
   backrank-=code;
   eval+=brv*backrank;

  /* center control */
     if(b[29] != FREE)
           if(b[29] == (WHITE|MAN)) eval -= 2;

     if(b[30] != FREE)
           if(b[30] == (WHITE|MAN)) eval -= 2;

    if(b[24] != FREE)
           if(b[24] == (WHITE|MAN)) eval -= 2;

   if(b[25] != FREE)
           if(b[25] == (WHITE|MAN)) eval -= 2;

     if(b[15] != FREE)
           if(b[15] == (BLACK|MAN)) eval += 2;

     if(b[16] != FREE)
           if(b[16] == (BLACK|MAN)) eval += 2;

     if(b[20] != FREE)
           if(b[20] == (BLACK|MAN)) eval += 2;

     if(b[21] != FREE)
           if(b[21] == (BLACK|MAN)) eval += 2;

        /*  edge         */

       if ( ( b[13] & BLACK ) != 0 )
         if ( ( b[13] & MAN ) != 0 )
            eval -= 2;

       if ( ( b[14] & BLACK ) != 0 )
        if ( ( b[14] & MAN ) != 0 )
           eval -= 2;

       if ( ( b[22] & BLACK ) != 0 )
         if ( ( b[22] & MAN ) != 0 )
            eval -= 2;

       if ( ( b[23] & BLACK ) != 0 )
         if ( ( b[23] & MAN ) != 0 )
           eval -= 2;

      if ( ( b[31] & BLACK ) != 0 )
         if ( ( b[31] & MAN ) != 0 )
           eval -= 2;

      if ( ( b[32] & BLACK ) != 0 )
         if ( ( b[32] & MAN ) != 0 )
            eval -= 2;

     if ( ( b[13] & WHITE ) != 0 )
         if ( ( b[13] & MAN ) != 0 )
            eval += 2;

       if ( ( b[14] & WHITE ) != 0 )
        if ( ( b[14] & MAN ) != 0 )
           eval += 2;

       if ( ( b[22] & WHITE ) != 0 )
         if ( ( b[22] & MAN ) != 0 )
            eval += 2;

       if ( ( b[23] & WHITE ) != 0 )
         if ( ( b[23] & MAN ) != 0 )
           eval += 2;

      if ( ( b[31] & WHITE ) != 0 )
         if ( ( b[31] & MAN ) != 0 )
           eval += 2;

      if ( ( b[32] & WHITE ) != 0 )
         if ( ( b[32] & MAN ) != 0 )
            eval += 2;

      // square c5
   if ( b[21] == (WHITE|MAN)) {
        eval -= 9;
   if ( b[22] == FREE )
         eval += 5;
       }

    if ( b[24] == (BLACK|MAN)) {
        eval += 9;
    if ( b[23] == FREE )
         eval -= 5;
      }

        // square f6

   if ( b[15] == (WHITE|MAN))
      eval -= 7;
  if ( b[30] == (BLACK|MAN))
      eval +=7;
       // square e5
   if ( b[25] == (BLACK|MAN)) {
      if (  nbm + nbk + nwm + nwk  > 16 )
          eval -= 3;
      else
          eval += 3;
      }

   if ( b[20] == (WHITE|MAN)) {
      if (  nbm + nbk + nwm + nwk  > 16 )
          eval += 3;
      else
          eval -= 3;
    }

   // square d6
  if ( b[16] == (WHITE|MAN))
      eval -= 7;
  if ( b[29] == (BLACK|MAN))
      eval +=7;

  // negamax formulation requires this:
  if( color == WHITE ) eval  = -eval;
                 //  eval=(eval/2)*2; // coarse grain ?
  return (eval);
 }


struct  coor numbertocoor(int n)
        {
    /* turns square number n into a coordinate for checkerboard */
  struct coor c;

	switch(n)
		{
		case 5:
			c.x=0;c.y=0;
			break;
		case 6:
			c.x=2;c.y=0;
			break;
		case 7:
			c.x=4;c.y=0;
			break;
		case 8:
			c.x=6;c.y=0;
			break;
		case 10:
			c.x=1;c.y=1;
			break;
		case 11:
			c.x=3;c.y=1;
			break;
		case 12:
			c.x=5;c.y=1;
			break;
		case 13:
			c.x=7;c.y=1;
			break;
		case 14:
			c.x=0;c.y=2;
			break;
		case 15:
			c.x=2;c.y=2;
			break;
		case 16:
			c.x=4;c.y=2;
			break;
		case 17:
			c.x=6;c.y=2;
			break;
		case 19:
			c.x=1;c.y=3;
			break;
		case 20:
			c.x=3;c.y=3;
			break;
		case 21:
			c.x=5;c.y=3;
			break;
		case 22:
			c.x=7;c.y=3;
			break;
		case 23:
			c.x=0;c.y=4;
			break;
		case 24:
			c.x=2;c.y=4;
			break;
		case 25:
			c.x=4;c.y=4;
			break;
		case 26:
			c.x=6;c.y=4;
			break;
		case 28:
			c.x=1;c.y=5;
			break;
		case 29:
			c.x=3;c.y=5;
			break;
		case 30:
			c.x=5;c.y=5;
			break;
		case 31:
			c.x=7;c.y=5;
			break;
		case 32:
			c.x=0;c.y=6;
			break;
		case 33:
			c.x=2;c.y=6;
			break;
		case 34:
			c.x=4;c.y=6;
			break;
		case 35:
			c.x=6;c.y=6;
			break;
		case 37:
			c.x=1;c.y=7;
			break;
		case 38:
			c.x=3;c.y=7;
			break;
		case 39:
			c.x=5;c.y=7;
			break;
		case 40:
			c.x=7;c.y=7;
			break;
		}
     return c;
	}


void setbestmove( struct move2 move)
{
   int i;
   int from, to;
   int jumps;
   struct coor c1;

   jumps = move.l -2;

   from = move.m[0] % 256;
   to = move.m[1] % 256;

   GCBmove.from = numbertocoor(from);
   GCBmove.to = numbertocoor(to);
   GCBmove.jumps = jumps;
   GCBmove.newpiece =  ( move.m[1] >> 8 );
   GCBmove.oldpiece =  ( move.m[0] >> 8 );
   for ( i=2; i < move.l ; i++ )
      {
              GCBmove.delpiece[i-2] = ( move.m[i] >> 8 );
              GCBmove.del[i-2] = numbertocoor( move.m[i] & 255 );
      }

  if ( jumps > 1 )
     {
         for ( i = 2; i < move.l; i++ )
                      {
                            c1 = numbertocoor( move.path[i - 1] );
                            GCBmove.path[i - 1] = c1;
                      }
     }
 else
  {
   GCBmove.path[1] = numbertocoor(to);
  }

}


void movetonotation(struct move2 move,char str[80])
	{
	int j,from,to;
	char c;

	from=move.m[0] % 256;
	to=move.m[1] % 256;
	from=from-(from/9);
	to=to-(to/9);
	from-=5;
	to-=5;
	j=from%4;from-=j;j=3-j;from+=j;
	j=to%4;to-=j;j=3-j;to+=j;
	from++;
	to++;
	c='-';
	if(move.l>2) c='x';
	sprintf(str,"%2d%c%2d",from,c,to);
	}


int  test_capture(int b[46], int color)
    {

   int i;

   if(color == BLACK) {

      for(i=5;i<=40;i++) {

          if ( b[i] == ( BLACK|MAN) )
      	{
               if( (b[i+4] & WHITE) !=0)
               	{
                  if( (b[i+8] & FREE) !=0)
                  	return(1);
	}

               if( (b[i+5] & WHITE) !=0)
               	{
                  if( (b[i+10] & FREE) !=0)
                  	return(1);
                  }

             if( (b[i-4] & WHITE) !=0)
	{
                  if( (b[i-8] & FREE) !=0)
                  	return(1);
                  }
               if( (b[i-5] & WHITE) !=0)
               	{
                  if( (b[i-10] & FREE) !=0)
                  	return(1);
                  }
                     }  // if MAN

            if ( b[i] == ( BLACK|KING ) )
            	{
            if ( Test_From_02b( b, i ))  return (1);
            if ( Test_From_13b( b, i )) return (1);
                   }

         } // for
    return (0);
 } // color

      if ( color == WHITE )
   	{
      for( i = 40;i >= 5;i-- )
      	{
         if ( b[i] == ( WHITE|MAN) )
	{
               if( (b[i-4] & BLACK) !=0)
               	{
                  if( (b[i-8] & FREE) !=0)
                  	return(1);
                  }
               if( (b[i-5] & BLACK) !=0)
               	{
                  if( (b[i-10] & FREE) !=0)
                  	return(1);
                  }
      if( (b[i+4] & BLACK) !=0)
               	{
                  if( (b[i+8] & FREE) !=0)
                  	return(1);
                  }
               if( (b[i+5] & BLACK) !=0)
               	{
                  if( (b[i+10] & FREE) !=0)
                  	return(1);
                  }
         } // if MAN

            if ( b[i] == ( WHITE|KING) )
            	{
            if ( Test_From_02w( b, i ))  return (1);
            if ( Test_From_13w( b, i )) return (1);
                  }

         } // for
      return (0);
      } // color
      return(0);
  }


            // Hash functions
U64 rand64(void)
{
   U64 temp = rand();
    temp ^= ((U64)rand() << 15);
    temp ^= ((U64)rand() << 30);
    temp ^= ((U64)rand() << 45);
    temp ^= ((U64)rand() << 60);
  return temp;
}


void Create_HashFunction(void)
{
   int p,q;
   srand((unsigned int) time(NULL));
   for ( p=0; p<=46 ; p++ )
      for ( q=0; q <=16 ; q++ )
        ZobristNumbers[p][q] = getUniqueZobrist();
}


U64 getUniqueZobrist(void)
{
  U64 key = rand64();
  while(isZobristUnique(key) != true)
    key = rand64();
  return key;
}


bool isZobristUnique(U64 key)
{
  int p,q;
  for(p=0;p<=46;p++ )
    for(q=0;q<=16;q++ )
        if(ZobristNumbers[p][q] == key)
          return false;

  return true;
}


U64 Position_to_Hashnumber( int b[46] , int color )
{
  U64 CheckSum = 0;
  int cpos;

  for ( cpos=5; cpos<=40; cpos++ ) {
    if  ( ( b[cpos] != OCCUPIED ) && ( b[cpos] != FREE ) )
     CheckSum ^= ZobristNumbers[cpos][b[cpos]];
                                                         }

  if ( color == BLACK )
           CheckSum = ~CheckSum;

  return (CheckSum);
}


void ClearTTable(void)
{
    // clear both TTable and killers
   if (TTable) free(TTable);
   TTable = (struct TEntry *)calloc(HASHTABLESIZE, sizeof(struct TEntry));
   // calloc clears memory
   memset(killersf, 0, sizeof(killersf));
   memset(killerst, 0, sizeof(killerst));
   memset(killersf2, 0, sizeof(killersf2));
   memset(killerst2, 0, sizeof(killerst2));
}


int compute( int b[46],int color, int time, char output[256])
	{
	// compute searches the best move on position b in time time.
	// it uses iterative deepening to drive the negamax search.
	int depth;
	int i;
	int value;
	int newvalue;
	int aspiration_phase;
	int dummy,alpha=-MATE,beta=MATE;
	int bestfrom;
	int bestto;
	int bestindex = 0;
	int n;
	double t, elapsed;
                  struct move2 movelist[MAXMOVES];
                  struct move2 lastbest;
	char str[256];
	char pv[256];
                  nodes = 0;
	realdepth = 0;
                  ClearHistory();
                  if(!TTable) ClearTTable();
	t=clock();
        search_timeout = 0;
        search_deadline = t + ((clock_t)time * CLOCKS_PER_SEC / 1000);

	sprintf(output,"KestoG variklis v1.1");
                  /* Always keep a legal fallback move */
        n = Gen_Captures(b, movelist, color);
        if (!n)
                n = Gen_Moves(b, movelist, color);

        if (n > 0) {
                bestrootmove = movelist[0];
                lastbest = bestrootmove;
        }

        newvalue = negamax(b, 1, alpha, beta,color,0);
        value = newvalue;
        for(depth=3;depth<MAXDEPTH && !search_timeout;depth++) {
                fprintf(stderr, "[DEBUG] DEPTH %d START\n", depth); fflush(stderr);
                                    lastbest = bestrootmove;
                                    aspiration_phase = 0;
                                    repeat_search:
		newvalue = negamax(b, depth, alpha, beta,color,0);
                                    /* KestoG DEPTH TIMEOUT */
                                    if (search_timeout)
                                            break;

		/* aspiration window */
                                    if ( newvalue <= alpha || newvalue >= beta ) {
                                          switch ( ++aspiration_phase ) {
                                            case 1: alpha = -210;beta = 210;break;
                                            case 2: alpha = -MATE;beta = MATE;break;
                                                        }
                                          goto repeat_search;
                                    }
                                    /* KestoG ACCEPT COMPLETE DEPTH ONLY */
                                    if (search_timeout)
                                            break;

                                    value = newvalue;
                                    alpha = value - 10;
                                    beta = value + 10;

		elapsed = (clock()-t)/CLOCKS_PER_SEC;

        //printf("depth %d %d %d\n", depth, (int)(1000*elapsed), (int)(time));
		
        bestfrom = -1;
		bestto = -1;
		// get best move from hashtable:
		hashretrieve(b, MAXMOVES+1, &dummy, &alpha, &beta, &bestfrom, &bestto, color);
		// we always store in the last call to negamax, so there MUST be a move here!
		n=Gen_Captures(b, movelist, color);
		if(!n)
			n=Gen_Moves(b,movelist, color);
                                    if(!n) {
                                      if( color == BLACK ) return -MATE;
                                      if( color == WHITE ) return MATE;
                                              }

                                    for ( i = 0; i < n; i++ )
                                      if ( (( movelist[i].m[0] ) % 256) == bestfrom &&  (( movelist[i].m[1] ) % 256) == bestto )
                                              bestindex = i;

                                    movetonotation(movelist[bestindex],str);
		sprintf(pv,"%s","");
		sprintf(output,"[thinking] [depth %i] [move %s] [time %.2f] [eval %i] [nodes %i], [pv %s]",depth,str,elapsed,value,nodes,pv);
		fprintf(stderr,"\n%s",output);

		// break conditions:
		// 1) time elapsed
		if(1000*elapsed > time)
			break;

		// found a win or a loss
		if(abs(value)>MATE-MAXDEPTH-1)
			break;

		// only one move todo!
		if(n==1)
			{
			value = 0;
			bestrootmove=movelist[0];
			break;
			}
                                    // interrupt by user
                                    if (*play) break;


                    } // for

	sprintf(pv,"%s","");

                  if (*play) {
                  depth--;
                  movetonotation(lastbest,str);
                  sprintf(output,"[interrupted] [depth %i] [move %s] [time %.2f] [eval %i] [nodes %i]",depth,str,elapsed,value,nodes);
                  fprintf(stderr,"\n%s",output);
                  domove(b, &lastbest);
                  setbestmove(lastbest);
                                 }
	else {
                  retrievepv(b,pv,color);
	sprintf(output,"[done] [depth %i] [move %s] [time %.2f] [eval %i] [nodes %i] [PV%s]",depth,str,elapsed,value,nodes,pv);
	fprintf(stderr,"\n%s",output);
                  domove(b, &bestrootmove);
                  setbestmove(bestrootmove);
                          }
	return value;
	}


int negamax( int b[46], int depth, int alpha, int beta, int color, int iid )
{
    //printf("negamax depth %d\n", depth);
	int value;
	int localalpha=alpha, localbeta=beta;
	int maxvalue=-MATE;

	int i,j,n;
	int p,q;
	int k,l;
	int bestfrom = -1;    // best move's from square
	int bestto = -1;        // best move's to square
	int capture;              // is there a capture for the side to move?

                  struct move2 movelist[MAXMOVES];
                  unsigned long int SortVals[MAXMOVES];
       //         struct move2 temp;
                  int bestindex = 0;
                  int best_from;
                  int best_to;
        //                  register int d;
        //                  register unsigned long int iVal;
                  unsigned long int newval;
                  U32 L_lock;  // local variable for saving position's  lock
                  int L_index;    // local variable for saving position's index
                  bool  first = true;
                  int dummy;
                  if (*play) return 0;
	nodes++;

        /* ===== KestoG TIMEOUT ===== */
        if (clock() >= search_deadline) {
                search_timeout = 1;
                return maxvalue;
        }


	// stop search if maximal search depth is reached
	if(realdepth>MAXDEPTH)
                     return evaluation(b,color);

	// todo: hashlookup here
	if ( depth > 1 ) {
	if(hashretrieve(b, depth, &value, &alpha, &beta, &bestfrom, &bestto, color)) {
                   // this position was in the table, and the value & depth stored make it possible to cutoff.
                      return value;
                               }
                                          }

                  L_lock = G_lock;   // save lock in local variable
                  L_index = G_index;  // save index in local variable

                  // check if the side to move has a capture:
	capture = test_capture(b,color);

	// now, check return condition - never evaluate with a capture on board!
	if(depth<=0 && !capture)
                     return evaluation(b,color);

	if(capture)
		n = Gen_Captures(b,movelist,color);
	else
		n = Gen_Moves(b,movelist,color);

	// if we have no move:
	if ( n == 0 )
                      return -MATE+realdepth;

          // IID - internal iterative deepening
          //
              if  (( depth > 3 ) && ( n > 1 ) && ( iid == 0) ) {
                 if (( bestfrom == -1 ) && ( bestto == -1 )) {
                    negamax(b, depth-3, alpha, beta, color, 1);
                    hashretrieve(b, MAXDEPTH+1, &dummy, &dummy, &dummy, &bestfrom, &bestto, color);
                                                                                    }
                                                             }

             if  ( ( n > 1 ) && ( depth >= 1 ) ) {
               // scan through movelist and fill SortVals array with move's values
               if ( bestfrom != -1 && bestto != -1 ) { // we have a move from hash table
       	  for ( i = 0; i < n; i++ ) {
                       p = ( movelist[i].m[0] ) % 256;
                       q =  ( movelist[i].m[1] ) % 256;
                       if ( p == bestfrom  )
                          if ( q == bestto ) {
                               SortVals[i] = 999999;continue;
                                }
                       if  ( p == killersf[realdepth] )
                          if ( q == killerst[realdepth] ) {
                               SortVals[i] = 99999;continue;
                                }
                       if  ( p == killersf2[realdepth] )
                          if ( q == killerst2[realdepth] ) {
                               SortVals[i] = 88888;continue;
                                }
                               SortVals[i] = History[p][q];
                                                      }  // for
                     } // if
                 else // no move from hash table available
                    {
                    for ( i = 0; i < n; i++ ) {
                       p = ( movelist[i].m[0] ) % 256;
                       q =  ( movelist[i].m[1] ) % 256;
                       if  ( p == killersf[realdepth] )
                          if ( q == killerst[realdepth] ) {
                               SortVals[i] = 99999;continue;
                                }
                       if  ( p == killersf2[realdepth] )
                          if ( q == killerst2[realdepth] ) {
                               SortVals[i] = 88888;continue;
                                }
                               SortVals[i] = History[p][q];
                                                       }  // for
                    }  // else

     /*
      // Insertion Sort
    for (d = 1; d < n ; d++ )
           {
            iVal = SortVals[d];
            temp = movelist[d];
      for ( i = d - 1; i >= 0 && ( iVal > SortVals[i] ) ; i-- )
                    {
                      // Move smaller values up one position
	     movelist[i+1] = movelist[i];
                       SortVals[i+1] = SortVals[i];
                    }
                    // Insert key into proper position
              movelist[i+1] = temp;
              SortVals[i+1] = iVal;
           }
              */

       // Quick Sort
       QuickSort( SortVals,movelist, 0, n-1);

     } //   if  ( ( n > 1 ) && ( depth >= 1 ) )

	for( i = 0; i < n; i++)
	{
		// domove
                                   domove(b,&movelist[i] );
		// recursion

		if (first) {
                    value = -negamax(b, depth-1, -beta, -localalpha,
                                     color^CHANGECOLOR, iid);
                    first = false;

                    /* Propagate timeout and restore parent position */
                    if (search_timeout) {
                        undomove(b,&movelist[i]);
                        return maxvalue;
                    }
                } else {
                    value = -negamax(b, depth-1, -(localalpha+1),
                                     -localalpha, color^CHANGECOLOR, iid);

                    /* Propagate timeout and restore parent position */
                    if (search_timeout) {
                        undomove(b,&movelist[i]);
                        return maxvalue;
                    }

                    if ( value > localalpha && value < localbeta) {
                        value = -negamax(b, depth-1, -beta, -localalpha,
                                         color^CHANGECOLOR, iid);

                        /* Propagate timeout and restore parent position */
                        if (search_timeout) {
                            undomove(b,&movelist[i]);
                            return maxvalue;
                        }
                    }
                }

		// undo move
		undomove(b,&movelist[i] );

		// update best value so far
		maxvalue=max(value,maxvalue);

		// and set alpha and beta bounds
		if(maxvalue>=localbeta)
			{
             p = ( movelist[i].m[0] ) % 256;
             q = ( movelist[i].m[1] ) % 256;
             if ( p !=  killersf[realdepth] || q != killerst[realdepth] ) {
             killersf2[realdepth]=killersf[realdepth];
             killerst2[realdepth] = killerst[realdepth];
             killersf[realdepth] = p;
             killerst[realdepth] = q;
                       }
                                                      bestindex=i;
			break;
			}
		if(maxvalue>localalpha)
			{
             p = ( movelist[i].m[0] ) % 256;
             q = ( movelist[i].m[1] ) % 256;
             if ( p !=  killersf[realdepth] || q != killerst[realdepth] ) {
             killersf2[realdepth]=killersf[realdepth];
             killerst2[realdepth] = killerst[realdepth];
             killersf[realdepth] = p;
             killerst[realdepth] = q;
                         }
			localalpha=maxvalue;
			bestindex=i;
           newval = History[p][q] + weight(depth);
           if ( newval > MAXHIST ) {
             for ( k=5;k<=40;k++)
               for ( l=5;l<=40;l++)
                  if ( k != l )
                    History[k][l] /= 16;
                       newval /= 16;
                    }
          History[p][q] = newval;
                                                     }
                 } // end main recursive loop of forallmoves

                  best_from = ( movelist[bestindex].m[0] ) % 256;
                  best_to = ( movelist[bestindex].m[1] ) % 256;
                  newval = History[best_from][best_to] + weight(depth);
                  if ( newval > MAXHIST ) {
                         for ( i=5;i<=40;i++)
                            for ( j=5;j<=40;j++)
                               if ( i != j )
                                   History[i][j] /= 16;
                           newval /= 16;
                        }

        History[best_from][best_to] = newval;

                  G_lock = L_lock;  // restore lock from local variable
                  G_index = L_index;  // restore index from local variable

                  hashstore(b, maxvalue, depth, alpha, beta, best_from, best_to);

	if(realdepth==0)
		bestrootmove = movelist[bestindex];

	return maxvalue;
	}


void hashstore(int b[46], int value, int depth, int alpha, int beta, int best_from, int best_to)
	{

                  U32 lock;
                  int index;

                  if ( depth <= 1 ) return;
	// get a hash signature for this position by restoring them from G_index and G_lock
	// restore index and lock

	index = G_index;
                  lock = G_lock;

                  if ( TTable[index].m_depth > depth ) return;  // replace only if the same depth or deeper

	// save
	TTable[index].m_best_from = best_from;
	TTable[index].m_best_to = best_to;
	TTable[index].m_depth = depth;
	TTable[index].m_lock = lock;
	TTable[index].m_value = value;
	if(value<=alpha)
		{
		TTable[index].m_valuetype = UPPER;
		return;
		}
	if(value>=beta)
		{
		TTable[index].m_valuetype = LOWER;
		return;
		}
	TTable[index].m_valuetype = EXACT;
	}


int hashretrieve(int b[46], int depth, int *value, int *alpha, int *beta, int *best_from, int *best_to, int color)
	{
	// hashretrieve looks for a position in the hashtable.
	// if it finds it, it first checks if the entry causes an immediate cutoff.
	// if it does, hashretrieve returns 1, 0 otherwise.
	// if it does not cause a cutoff, hashretrieve tries to narrow the alpha-beta window
	// and sets the best move to that stored in the table for move ordering.

                  U64 h;
	int index;
                  U32 lock;
                  int tempVal;

	// get signature as 64 bit large number h
	// h is calculated from scratch
                  h = Position_to_Hashnumber(b,color);

	// get index
	index = h % HASHTABLESIZE;
	// get lock
                  lock = h >> 32;

                  // save both  index and lock in global variables
                  G_index = index;
                  G_lock = lock;

	// check if it's the right position
	if( TTable[index].m_lock != lock)
		// not right, return 0
		return 0;

	// check if depth this time round is higher
	if( depth > TTable[index].m_depth)
		{
		// we are searching with a higher remaining depth than what is in the hashtable.
		// all we can do is set the best move for move ordering
		*best_from = TTable[index].m_best_from;
		*best_to = TTable[index].m_best_to;
		return 0;
		}

                                    if ( (abs(TTable[index].m_value) ) > (MATE - MAXMOVES - 1 ) ) {
                              	if ( TTable[index].m_value > 0 )
                                      tempVal =  TTable[index].m_value -1;
                                    if ( TTable[index].m_value < 0 )
                                      tempVal =  TTable[index].m_value +1;
                                                                                                     }
                                    else
                                    tempVal =  TTable[index].m_value;

	// we have sufficient depth in the hashtable to possibly cause a cutoff.
	// if we have an exact value, we don't need to search for a new value.
	if( TTable[index].m_valuetype == EXACT)
		{
		*value = tempVal;
                                     return 1;
		}

	// if we have a lower bound, we might either get a cutoff or raise alpha.
	if( TTable[index].m_valuetype == LOWER)
		{
		// the value stored in the hashtable is a lower bound, so it's useful
		if( tempVal >= *beta)
			{
			// value > beta: we can cutoff!
                                                     *value = tempVal;
			return 1;
			}

		if( tempVal > *alpha)
			// value > alpha: we can adjust bounds
			*alpha = tempVal;
                            		*best_from = TTable[index].m_best_from;
                                                      *best_to = TTable[index].m_best_to;
                          		return 0;
		}

	// if we have an upper bound, we can either get a cutoff or lower beta.
	if( tempVal <= *alpha)
		{
                                   *value = tempVal;
		return 1;
		}

	if( tempVal < *beta)
		*beta = tempVal;
                           	*best_from = TTable[index].m_best_from;
                              	*best_to = TTable[index].m_best_to;
                                   	return 0;
	}


void retrievepv( int b[46], char *pv, int color)
	{
	// gets the pv from the hashtable
	// get a pv string:
	int n;
	int i;
	int bestfrom;
	int bestto;
	int bestindex = 0;
                  struct move2 movelist[MAXMOVES];
	int dummy, alpha, beta;
	char pvmove[256];
	int count = 0;
                  int copy[46];
                  // original board b[46] needs not to be changed
                  for ( i=0;i<46;i++ )
                      copy[i] = b[i];

	bestfrom = -1;
	bestto = -1;
	hashretrieve( copy, MAXDEPTH+1, &dummy, &alpha, &beta, &bestfrom, &bestto, color);
	sprintf(pv,"%s","");
	while(bestfrom != -1 && bestto != -1 && count<10)
		{
		// we always store in the last call to negamax, so there MUST be a move here!

		n = Gen_Captures( copy, movelist, color);
		if(!n)
			n = Gen_Moves( copy, movelist, color);
                                    if (!n) return;
                                    for ( i = 0; i < n ; i++ )
                                       if ( (( movelist[i].m[0] ) % 256) == bestfrom &&  (( movelist[i].m[1] ) % 256) == bestto )
                                              bestindex = i;

		movetonotation(movelist[bestindex],pvmove);
		domove( copy, &movelist[bestindex] );
                                    color = color^CHANGECOLOR;
		// look up next move
		bestfrom = -1;
		bestto = -1;
		hashretrieve( copy, MAXMOVES+1, &dummy, &alpha, &beta, &bestfrom, &bestto, color);
                    	strcat(pv," ");
		strcat(pv,pvmove);
		count++;
		}
	}


int weight( int depth ) {
     //
     int a;
     if ( depth <= 1 ) return 1;
     a = depth*depth;
     return a;
 }


void ClearHistory(void) {
     //
     int p,q;
     for ( p=0;p<46;p++)
       for ( q=0;q<46;q++) {
         History[p][q] = 0;
         History[p][q] = 0;
           }
 }


void QuickSort( unsigned long int SortVals[MAXMOVES],struct move2 movelist[MAXMOVES], int inf, int sup) {
        // quick sort algorithm
        unsigned long int pivot;
        int i,j;
        int swap;
        struct move2 temp;
        i = inf;
        j = sup;
        pivot = SortVals[(i+j)/2];
	do {
		while (SortVals[i] > pivot) i++;
		while (SortVals[j] < pivot) j--;
		if (i<j) {
			swap = SortVals[i];
			SortVals[i] = SortVals[j];
			SortVals[j] = swap;
			temp = movelist[i];
			movelist[i] = movelist[j];
			movelist[j] = temp;
		}
		if (i<=j) {
			i++;
			j--;
		}
	} while (i<=j);
    if (inf<j) QuickSort(SortVals,movelist,inf,j);
    if (i<sup) QuickSort(SortVals,movelist,i,sup);
}


int make_prime(int n)
 {
   if ((n & 1) == 0) n--;

   while(!is_prime(n)) n -= 2;
     return(n);
 }


bool is_prime(long n)
 {
    long i;

    if ((n & 1) == 0)
      return(false);
    for (i = 3; i < n; i += 2)
     if ((n % i) == 0)
      return(false);
    return(true);
 }

/* BELOW IS MY HELPER CODE, THIS IS NOT PART OF THE ORIGINAL ENGINE!!! */

// white man 5
// black man 6
// white king 9
// black king 10

/* set board position */
int input_board[8][8] = { // white on the right, black on the left
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  
  /*{ 6, 0, 6, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 0, 0, 5, 0, 5 },
  { 6, 0, 6, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 0, 0, 5, 0, 5 },
  { 6, 0, 6, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 0, 0, 5, 0, 5 },
  { 6, 0, 6, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 0, 0, 5, 0, 5 }*/

  /*{ 6, 0, 6, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 0, 0, 0, 0, 5 },
  { 6, 0, 6, 0, 0, 0, 0, 0 },
  { 0, 6, 0, 0, 0, 0, 0, 0 },
  { 6, 0, 6, 0, 6, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 5 },
  { 6, 0, 6, 0, 5, 0, 5, 0 },
  { 0, 6, 0, 0, 0, 0, 0, 5 }*/
  
  /*{ 6, 0, 6, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 0, 0, 0, 0, 0 },
  { 6, 0, 0, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 6, 0, 0, 0, 0 },
  { 6, 0, 0, 0, 6, 0, 5, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 9, 0, 6, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 0, 0, 0, 0, 5 }*/
  
  /*{ 0, 0, 6, 0, 0, 0, 0, 0 }, // turkish
  { 0, 6, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 5, 0, 5, 0 },
  { 0, 0, 0, 0, 0, 5, 0, 0 },
  { 0, 0, 6, 0, 5, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 5, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0,10, 0, 0, 0, 0 }*/
  
  /*{ 0, 0, 0, 0, 0, 0, 5, 0 }, // double
  { 0, 0, 0, 0, 0, 5, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 5, 0 },
  { 0, 6, 0, 6, 0, 0, 0, 9 },
  { 0, 0, 6, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 6, 0, 0 },
  { 0, 0, 6, 0, 0, 0, 0, 0 },
  { 0, 6, 0, 0, 0, 0, 0, 0 }*/
};

/* print board */
void print_input_board() {
  printf("\n");
  for (int r = 0; r < 8; r++) {
    for (int c = 0; c < 8; c++) {
      if (c==0) printf(" %d", 8-r);
      switch(input_board[7-c][r]) {
        case WHITE|MAN: printf(" o"); break;
        case WHITE|KING: printf(" O"); break;
        case BLACK|MAN: printf(" x"); break;
        case BLACK|KING: printf(" X"); break;
        case 0: printf(" ."); break;
      }
    }
    printf("\n");
  } printf("   a b c d e f g h\n\n");
}

void print_board46(int b[46]) {

}

void move_from_initial_position() {
  printf("\n Before:\n");
  char status[1024];
  int playnow = 0;
  struct CBmove move;

  print_input_board();  

  /* call engine to get move for BLACK */
  // input_board[8][8], color, maxtime, status, playnow, info, unused, struct CBmove *move);
  getmove(input_board, WHITE, 1.0, status, &playnow, 1, 0, &move);
  printf("Status: %s\n", status);
  printf("Move from (%d,%d) to (%d,%d)\n",
          move.from.x, move.from.y,
          move.to.x, move.to.y);
  printf("Old piece: %d, New piece: %d\n", move.oldpiece, move.newpiece);
  if (move.jumps > 0) {
    printf("Jump path (%d jumps):\n", move.jumps);
    for (int i = 0; i < move.jumps; i++) {
      printf("  step %d: (%d,%d), captured piece: %d\n",
                i + 1,
                move.path[i].x, move.path[i].y,
                move.delpiece[i]);
      }
  }
  printf("\n After:\n");
  print_input_board();
}

char *sq_to_coord(int sq) {
  char *coords[] = {
    "xx",
    "b8", "d8", "f8", "h8",
    "a7", "c7", "e7", "g7",
    "b6", "d6", "f6", "h6",
    "a5", "c5", "e5", "g5",
    "b4", "d4", "f4", "h4",
    "a3", "c3", "e3", "g3",
    "b2", "d2", "f2", "h2",
    "a1", "c1", "e1", "g1"
  }; return coords[sq];
}

void movetostring(struct move2 move,char str[80])
{
  int j,from,to;
  char c;
  
  from=move.m[0] % 256;
  to=move.m[1] % 256;
  from=from-(from/9);
  to=to-(to/9);
  from-=5;
  to-=5;
  j=from%4;from-=j;j=3-j;from+=j;
  j=to%4;to-=j;j=3-j;to+=j;
  from++;
  to++;
  c='-';
  if(move.l>2) c='x';
  //sprintf(str,"%2d%c%2d  %s%c%s",from, c, to, sq_to_coord(from), c, sq_to_coord(to));
  sprintf(str,"%s%c%s",sq_to_coord(from), c, sq_to_coord(to));
}

void array_to_board(int board[8][8], int b[46]) {
  int i;
  int value;
  Create_HashFunction();
  /* initialize board */
  for(i=0;i<46;i++)
    b[i]=OCCUPIED;
  for(i=5;i<=40;i++)
    b[i]=FREE;
    b[5]=board[0][0];b[6]=board[2][0];b[7]=board[4][0];b[8]=board[6][0];
    b[10]=board[1][1];b[11]=board[3][1];b[12]=board[5][1];b[13]=board[7][1];
    b[14]=board[0][2];b[15]=board[2][2];b[16]=board[4][2];b[17]=board[6][2];
    b[19]=board[1][3];b[20]=board[3][3];b[21]=board[5][3];b[22]=board[7][3];
    b[23]=board[0][4];b[24]=board[2][4];b[25]=board[4][4];b[26]=board[6][4];
    b[28]=board[1][5];b[29]=board[3][5];b[30]=board[5][5];b[31]=board[7][5];
    b[32]=board[0][6];b[33]=board[2][6];b[34]=board[4][6];b[35]=board[6][6];
    b[37]=board[1][7];b[38]=board[3][7];b[39]=board[5][7];b[40]=board[7][7];
  for(i=5;i<=40;i++)
    if ( b[i] == 0 ) b[i]=FREE;
    for(i=9;i<=36;i+=9)
      b[i]=OCCUPIED;
}

int get_time_ms() {
  struct timeval time_value;
  gettimeofday(&time_value, NULL);
  return time_value.tv_sec * 1000 + time_value.tv_usec / 1000;
}

void perft_driver(int b[46], int depth, int color) {
  if (depth == 0) {
    nodes++;
    return;
  }
  int capture, i, n;
  struct move2 movelist[MAXMOVES];
  capture = test_capture(b, color);
  
  n = Gen_Captures(b,movelist, color);
  if (!n) n = Gen_Moves(b, movelist, color);
  
  //if (capture) n = Gen_Captures(b,movelist,color);
  //else n = Gen_Moves(b,movelist,color);
  for (i = 0; i < n; i++) {
    domove(b,&movelist[i]);
    perft_driver(b, depth-1, color^CHANGECOLOR);
    undomove(b,&movelist[i]);
  }
}

void perft_test(int depth, int color) {
  U64 start = get_time_ms();
  int b[46];
  print_input_board();
  printf(" Perft test, depth %d:\n\n", depth);
  array_to_board(input_board, b);
  int capture, i, n;
  char moveStr[80];
  struct move2 movelist[MAXMOVES];
  capture = test_capture(b, color);
  
  n = Gen_Captures(b,movelist, color);
  if (!n) n = Gen_Moves(b, movelist, color);
  
  //if (capture) n = Gen_Captures(b,movelist,color);
  //else n = Gen_Moves(b,movelist,color);
  
  
  for (i = 0; i < n; i++) {
    domove(b,&movelist[i]);
    U64 cummulative_nodes = nodes;
    perft_driver(b, depth-1, color^CHANGECOLOR);
    undomove(b,&movelist[i]);
    U64 old_nodes = nodes - cummulative_nodes;
    movetostring(movelist[i], moveStr);
    printf(" Move: %s, nodes: %lu\n", moveStr, old_nodes);
  }
  // print results
  printf("\n    Depth: %d\n", depth);
  printf("    Nodes: %d\n", nodes);
  printf("     Time: %ld\n\n", get_time_ms() - start);
}

void test() {
  int b[46];
  char moveStr[80];
  array_to_board(input_board, b);
  print_input_board();
  struct move2 movelist[MAXMOVES];
  int n;
  //black_king_capture(b, &n, movelist, 13);
  n = Gen_Captures(b, movelist, WHITE);
  for (int i = 0; i < n; i++) {
    movetostring(movelist[i], moveStr);
    printf(" Move: %s   %d\n", moveStr, (int)(movelist[i].l));
    for (int j = 0; j < 10; j++) printf("    m %d, path %d\n", (int)(movelist[i].m[j]), (int)(movelist[i].path[j]));
  }
}

void parse_fen(char *fen, int *color, int *b) {
  nodes = 0;
  for (int i = 0; i < 8; i++)
    for (int j = 0; j < 8; j++)
      input_board[i][j] = 0;
  
  *color = (*fen == 'W') ? WHITE : BLACK;
  fen += 2;
  int pce = WHITE;
  int rank = MAN;
  while (*fen != 0) {
    int row, col;
    switch(*fen) {
      case 'B': pce = BLACK; break;
      case 'K': rank = KING;
      case 'a': row = 7; break;
      case 'b': row = 6; break;
      case 'c': row = 5; break;
      case 'd': row = 4; break;
      case 'e': row = 3; break;
      case 'f': row = 2; break;
      case 'g': row = 1; break;
      case 'h': row = 0; break;
      case '1': col = 7; break;
      case '2': col = 6; break;
      case '3': col = 5; break;
      case '4': col = 4; break;
      case '5': col = 3; break;
      case '6': col = 2; break;
      case '7': col = 1; break;
      case '8': col = 0; break;
      case ':':
      case ',':
        input_board[row][col] = pce|rank;
        rank = MAN;
        break;
    }
    *fen++;
    if (*fen == 0) input_board[row][col] = pce|rank;
  } array_to_board(input_board, b);
}

void perft_test_suit() {
  int b[46];  
  int color;
  
  parse_fen("W:Wa3,c3,e3,g3,b2,d2,f2,h2,a1,c1,e1,g1:Bb8,d8,f8,h8,a7,c7,e7,g7,b6,d6,f6,h6", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wa7,a5,b4,c3,f2,h2,g1:Bb8,c7,e7,g7,g5,f4,h4:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wd6,a3,g3,f2,h2,c1,g1:Bb8,f8,h8,b6,f6,h6,h4:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("B:Wc5,e5,b4,a3,e3,f2,h2,g1:Bb8,h8,a7,c7,g7,h6,g5,h4:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wc5,b4,d4,f4,a3,f2,h2,g1:Bd8,a7,e7,g7,d6,f6,h6,h4:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wc5,e5,d4,g3,d2,f2,a1,c1,e1,g1:Bf8,h8,a7,c7,e7,g7,b6,h6,a5,g5:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("B:Wb4,d4,f4,a3,e3,g3,b2,d2,f2,a1,e1,g1:Bb8,d8,f8,h8,a7,c7,e7,b6,h6,c5,g5,h4:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wa5,d4,f4,a3,c3,e3,h2,c1:Bb8,a7,c7,b6,f6,h6,c5,g5:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wg5,f4,h4,a3,e3,d2:Bf8,h8,e7,b6,d6,h6:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wd4,f4,h4,a3,c3:Bd8,e7,b6,h6,c5:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wd4,f4,a3,c3,e3,d2,f2,h2,c1,e1,g1:Bb8,d8,f8,h8,a7,b6,d6,h6,c5,g5,h4:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("W:Wc5,d4,f4,h4,g3,h2,e1:Bf8,a7,e7,g7,d6,a5:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
  
  parse_fen("B:Wd4,f4,a3,e3,b2,f2,h2,e1,g1:Bb8,d8,h8,g7,b6,d6,h6,a5,c5,h4:H0:F1", &color, b);
  printf(" Side to move: %s\n", (color == 2) ? "black" : "white");
  perft_test(10, color);
}

int kestog_original_main() {
  move_from_initial_position();
  //test();
  perft_test_suit();
  return 0;
}
