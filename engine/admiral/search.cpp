#define ADMIRAL_EMBED_TACTICS
#include "tactics.cpp"
#include <chrono>
#include <unordered_map>
#include <stdexcept>
using Clock=std::chrono::steady_clock;
struct Timeout{};
struct Entry{int depth,score,flag;};
struct Search{
 Clock::time_point deadline; uint64_t nodes=0; std::unordered_map<std::string,Entry> tt;
 void tick(){++nodes;if(Clock::now()>=deadline)throw Timeout{};}
 std::string key(const Board& b,int s){std::string k;for(int p:b)k+=char(p);k+=char(s);return k;}
 int q(const Board& b,int s,int a,int z){tick();auto ms=legal(b,s);if(ms.empty())return -100000;if(ms[0].captured.empty())return evaluate(b,s);int best=-1000000;for(auto& m:ms){int v=-q(apply_move(b,m),3-s,-z,-a);best=std::max(best,v);a=std::max(a,v);if(a>=z)break;}return best;}
 int neg(const Board& b,int s,int d,int a,int z){if(!d)return q(b,s,a,z);tick();auto k=key(b,s);int old=a;auto it=tt.find(k);if(it!=tt.end()&&it->second.depth>=d){auto e=it->second;if(e.flag==0||(e.flag==1&&e.score>=z)||(e.flag==2&&e.score<=a))return e.score;}
 auto ms=legal(b,s);if(ms.empty())return -100000;int best=-1000000;for(auto& m:ms){int v=-neg(apply_move(b,m),3-s,d-1,-z,-a);best=std::max(best,v);a=std::max(a,v);if(a>=z)break;}if(tt.size()<200000)tt[k]={d,best,best<=old?2:best>=z?1:0};return best;}
};
struct Result{Move move;int depth=0,score=0;uint64_t nodes=0;};
Result choose(const Board& b,int s,int ms,int maxdepth){auto moves=legal(b,s);if(moves.empty())return {};Result r{moves[0]};Search x;x.deadline=Clock::now()+std::chrono::milliseconds(ms);for(int d=1;d<=maxdepth;d++){try{int best=-1000000;Move bm=moves[0];for(auto& m:moves){int v=-x.neg(apply_move(b,m),3-s,d-1,-1000000,-best);if(v>best){best=v;bm=m;}}r.move=bm;r.score=best;r.depth=d;if(best>=100000)break;auto it=std::find_if(moves.begin(),moves.end(),[&](const Move& m){return m.path==bm.path&&m.captured==bm.captured;});if(it!=moves.end())std::rotate(moves.begin(),it,it+1);}catch(Timeout&){break;}}r.nodes=x.nodes;return r;}
int main(int argc,char** argv){if(argc==2&&std::string(argv[1])=="--test"){movegen_cli_main(argc,argv);evaluation_cli_main(argc,argv);tactics_cli_main(argc,argv);Board b{};for(int r=0;r<8;r++)for(int c=0;c<8;c++)if((r+c)%2)b[r*8+c]=r<3?2:r>4?1:0;auto r=choose(b,1,1000,3);assert(r.depth==3);auto ms=legal(b,1);assert(std::any_of(ms.begin(),ms.end(),[&](auto& m){return m.path==r.move.path;}));assert(!choose(b,2,1000,2).move.path.empty());b={};assert(choose(b,1,100,3).move.path.empty());b[42]=1;b[35]=2;b[21]=2;r=choose(b,1,100,4);assert(r.score==100000&&r.move.captured.size()==2);b={};b[42]=1;b[28]=2;r=choose(b,1,1000,3);assert(r.move.path.back()==33);assert(!choose(b,1,0,20).move.path.empty());std::cout<<"7 search checks passed\n";return 0;}int s,ms,d;Board b{};if(!(std::cin>>s>>ms>>d)||s<1||s>2||ms<0||ms>60000||d<1||d>64)return 1;for(int i=0;i<64;i++)if(!(std::cin>>b[i])||b[i]<0||b[i]>4||(b[i]&&(i/8+i%8)%2==0))return 1;auto r=choose(b,s,ms,d);std::cout<<"depth "<<r.depth<<" score "<<r.score<<" nodes "<<r.nodes<<"\npath";for(int i:r.move.path)std::cout<<' '<<i;std::cout<<"\ncaptured";for(int i:r.move.captured)std::cout<<' '<<i;std::cout<<'\n';}
