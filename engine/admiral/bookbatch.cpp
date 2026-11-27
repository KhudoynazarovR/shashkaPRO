#define main movegen_main
#include "movegen.cpp"
#undef main
int main(){int s;Board b;while(std::cin>>s){for(auto& v:b)if(!(std::cin>>v))return 1;std::cout<<legal(b,s).size()<<'\n';}}
