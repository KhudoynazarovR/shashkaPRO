// Independent experimental evaluation; not recovered Tornado code.
#define main movegen_cli_main
#include "movegen.cpp"
#undef main
#include <algorithm>
int evaluate(const Board& b,int s){
 int score=0;
 for(int i=0;i<64;i++){
 int p=b[i]; if(!p)continue;
 int r=i/8,c=i%8, owner=side(p);
 int v=p>=3?300:100;
 if(p<3){v+=4*(owner==1?7-r:r); if((owner==1&&r==7)||(owner==2&&r==0))v+=8;}
 if(r>=2&&r<=5&&c>=2&&c<=5)v+=8;
 for(auto& d:dirs){int x=r+d[0],y=c+d[1];if(inside(x,y)&&side(b[x*8+y])==owner)v+=3;}
 score+=(owner==s?v:-v);
 }
 score+=2*(int(legal(b,s).size())-int(legal(b,3-s).size()));
 return score;
}
int evaluation_cli_main(int argc,char** argv){
 if(argc==2&&std::string(argv[1])=="--test"){
 Board b{};for(int r=0;r<8;r++)for(int c=0;c<8;c++)if((r+c)%2)b[r*8+c]=r<3?2:r>4?1:0;
 assert(evaluate(b,1)==0); b={};b[42]=1;assert(evaluate(b,1)>0);assert(evaluate(b,1)==-evaluate(b,2));
 int man=evaluate(b,1);b[42]=3;assert(evaluate(b,1)>man);
 b={};b[42]=1;int before=evaluate(b,1);b={};b[26]=1;assert(evaluate(b,1)>before);
 b[35]=2;Board mirror{};for(int i=0;i<64;i++)if(b[i])mirror[63-i]=b[i]%2?b[i]+1:b[i]-1;assert(evaluate(b,1)==evaluate(mirror,2));
 std::cout<<"6 evaluation checks passed\n";return 0;}
 int s;Board b{};if(!(std::cin>>s)||(s!=1&&s!=2))return 1;for(int i=0;i<64;i++)if(!(std::cin>>b[i])||b[i]<0||b[i]>4||(b[i]&&(i/8+i%8)%2==0))return 1;std::cout<<evaluate(b,s)<<'\n';return 0;
}
#ifndef ADMIRAL_EMBED_EVAL
int main(int argc,char** argv){return evaluation_cli_main(argc,argv);}
#endif
