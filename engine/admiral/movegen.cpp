#include <array>
#include <vector>
#include <iostream>
#include <cassert>
#include <cstdint>
using Board=std::array<int,64>; // 0 empty, 1 white, 2 black, 3 white king, 4 black king
struct Move { std::vector<int> path, captured; };
int side(int p){return p?1+(p-1)%2:0;}
bool inside(int r,int c){return r>=0&&r<8&&c>=0&&c<8;}
int crown(int p,int r){return p==1&&r==0?3:p==2&&r==7?4:p;}
const int dirs[4][2]={{-1,-1},{-1,1},{1,-1},{1,1}};
void captures(Board& b,int pos,int p,uint64_t taken,Move& m,std::vector<Move>& out){
 bool more=false; int r=pos/8,c=pos%8;
 for(auto& d:dirs){int x=r+d[0],y=c+d[1];
 if(p>=3)while(inside(x,y)&&!b[x*8+y]){x+=d[0];y+=d[1];}
 if(!inside(x,y))continue; int victim=x*8+y;
 if(!b[victim]||side(b[victim])==side(p)||(taken&(uint64_t(1)<<victim)))continue;
 x+=d[0];y+=d[1];
 while(inside(x,y)&&!b[x*8+y]){int dest=x*8+y,np=crown(p,x);more=true;
 b[pos]=0;b[dest]=np;m.path.push_back(dest);m.captured.push_back(victim);
 captures(b,dest,np,taken|(uint64_t(1)<<victim),m,out);
 m.path.pop_back();m.captured.pop_back();b[dest]=0;b[pos]=p;
 if(p<3)break; x+=d[0];y+=d[1];}
 }
 if(!more&&!m.captured.empty())out.push_back(m);
}
std::vector<Move> legal(Board b,int s){std::vector<Move> out;
 for(int i=0;i<64;i++)if(side(b[i])==s){Move m{{i},{}};captures(b,i,b[i],0,m,out);}
 if(!out.empty())return out;
 for(int i=0;i<64;i++)if(side(b[i])==s){int p=b[i];for(auto& d:dirs){if(p<3&&d[0]!=(s==1?-1:1))continue;int r=i/8+d[0],c=i%8+d[1];while(inside(r,c)&&!b[r*8+c]){out.push_back({{i,r*8+c},{}});if(p<3)break;r+=d[0];c+=d[1];}}}return out;
}
int main(int argc,char** argv){if(argc==2&&std::string(argv[1])=="--test"){
 Board b{};for(int r=0;r<8;r++)for(int c=0;c<8;c++)if((r+c)%2)b[r*8+c]=r<3?2:r>4?1:0;assert(legal(b,1).size()==7);assert(legal(b,2).size()==7);
 b={};b[42]=1;b[35]=2;b[21]=2;auto m=legal(b,1);assert(m.size()==1&&m[0].captured.size()==2&&m[0].path.back()==14);
 b={};b[17]=1;b[10]=2;b[12]=2;m=legal(b,1);assert(!m.empty());for(auto& v:m)assert(v.captured.size()==2);
 b={};b[42]=3;b[35]=2;m=legal(b,1);assert(m.size()==4);for(auto& v:m)assert(v.captured.size()==1);
 b={};b[26]=1;b[35]=2;m=legal(b,1);assert(m.size()==1&&m[0].path.back()==44);
 std::cout<<"6 checks passed\n";return 0;}
 int s;Board b{};if(!(std::cin>>s)||(s!=1&&s!=2))return 1;for(int i=0;i<64;i++)if(!(std::cin>>b[i])||b[i]<0||b[i]>4||(b[i]&&(i/8+i%8)%2==0))return 1;
 for(auto& m:legal(b,s)){for(int i:m.path)std::cout<<i<<' ';std::cout<<"| ";for(int i:m.captured)std::cout<<i<<' ';std::cout<<'\n';}return 0;}
