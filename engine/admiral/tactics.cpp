// Independent experimental tactics, not recovered Tornado source.
#define ADMIRAL_EMBED_EVAL
#include "evaluate.cpp"
#undef ADMIRAL_EMBED_EVAL
#include <limits>
Board apply_move(Board b,const Move& m){int p=b[m.path.front()];b[m.path.front()]=0;for(int x:m.captured)b[x]=0;for(int x:m.path)p=crown(p,x/8);b[m.path.back()]=p;return b;}
int tactical_score(const Board& b,int s,int depth){auto moves=legal(b,s);if(moves.empty())return -100000-depth;if(depth==0||moves.front().captured.empty())return evaluate(b,s);int best=-1000000;for(const auto& m:moves)best=std::max(best,-tactical_score(apply_move(b,m),3-s,depth-1));return best;}
int move_score(const Board& b,int s,const Move& m){return -tactical_score(apply_move(b,m),3-s,6);}
int tactics_cli_main(int argc,char** argv){if(argc==2&&std::string(argv[1])=="--test"){
Board b{};b[42]=1;b[35]=2;b[21]=2;auto m=legal(b,1);auto a=apply_move(b,m.at(0));assert(a[14]==1&&a[35]==0&&a[21]==0&&a[42]==0);assert(move_score(b,1,m[0])>90000);
b={};b[17]=1;b[10]=2;b[12]=2;m=legal(b,1);a=apply_move(b,m[0]);assert(a[m[0].path.back()]==3);
b={};assert(tactical_score(b,1,6)<-90000);
b={};b[42]=1;b[28]=2;m=legal(b,1);assert(m.size()==2);int safe=0,risky=0;for(auto& v:m){if(v.path.back()==35)risky=move_score(b,1,v);else safe=move_score(b,1,v);}assert(safe>risky);
b={};b[42]=1;b[19]=2;assert(tactical_score(b,1,6)==evaluate(b,1));std::cout<<"6 tactics checks passed\n";return 0;}
int s;Board b{};if(!(std::cin>>s)||(s!=1&&s!=2))return 1;for(int i=0;i<64;i++)if(!(std::cin>>b[i])||b[i]<0||b[i]>4||(b[i]&&(i/8+i%8)%2==0))return 1;auto moves=legal(b,s);std::vector<std::pair<int,Move>> ranked;for(auto& m:moves)ranked.push_back({move_score(b,s,m),m});std::stable_sort(ranked.begin(),ranked.end(),[](const auto& a,const auto& b){return a.first>b.first;});for(auto& v:ranked){std::cout<<v.first<<": ";for(int x:v.second.path)std::cout<<x<<' ';std::cout<<'\n';}return 0;}
#ifndef ADMIRAL_EMBED_TACTICS
int main(int argc,char** argv){return tactics_cli_main(argc,argv);}
#endif
