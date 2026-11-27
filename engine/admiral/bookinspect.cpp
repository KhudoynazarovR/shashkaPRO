#include <array>
#include <fstream>
#include <iostream>
#include <map>
#include <cstdint>
#include <algorithm>
int main(int argc,char**argv){if(argc!=2){std::cerr<<"usage: bookinspect openings.tdl\n";return 1;}std::ifstream f(argv[1],std::ios::binary);std::array<unsigned char,100> h{};if(!f.read(reinterpret_cast<char*>(h.data()),h.size()))return 2;uint32_t count=0;for(int i=0;i<4;i++)count|=uint32_t(h[i])<<(8*i);std::map<std::array<unsigned char,75>,size_t> freq;std::array<unsigned char,75> r{};size_t total=0;while(f.read(reinterpret_cast<char*>(r.data()),r.size())){++freq[r];++total;}if(f.bad()||f.gcount()!=0)return 3;if(freq.empty())return 4;auto common=std::max_element(freq.begin(),freq.end(),[](auto&a,auto&b){return a.second<b.second;});std::cout<<"header_count "<<count<<"\nblocks "<<total<<"\nunique "<<freq.size()<<"\nmost_common "<<common->second<<"\nother_blocks "<<total-common->second<<"\n";return 0;}
