const fs=require('fs'),zlib=require('zlib'),D='partiyalar/';
const K=`Скифи|Эдэон-Профи|K|2|jm ur lp ws hl so ls vo kt xo mv Ar ej yu jm zv mq vs qz Cv ae Bx ej Dz jm FB be EA ej Bw gk zu kt xo mq rn qz ne ib vC fk of bk Cz cf zu fj uq ko sl pg ws gk Aw kn qm jq sj
Эдэон-Профи|Скифи|K|2|jn vr ej wt jm uq mv zsj fm qj bf yu fm uq mr Aw ae ws lo sl ho Bw ej DA jn Av rA wD cf FB fj tp nr Bw kn EA gl pg dk wt os Aw sB xE ns EB rv tp ko Dz vA qm jq zu qz CvE sv Bw vz wt ox pl
Аврора|Каллисто|K|2|jm wt mq Bw ej tp jn ur nu yr ae FB kn rk gn pg cl wt fk Bw ej vs lo sl ho Av bf vs ov zs nr EA ru so uy ol im lg jn Av nr gnu qzsB xE fk EB mq Dz dg Bw gl ws lp
Каллисто|Аврора|K|2|jn wt nr un kr vm ir to ls zu rv Ar hl rm lo mi ej uq gl Bw sB Fw jn EA os qm sB xE fk yu lp Aw ko Cz cf uq dg DA os EB fk zu sv Ar bf Bx gl xt lo mj fmv qm ox mj ne iboC pt wp xB
Тундра|Тоша|K|3|kn xt lp vs im Bx mr to gk EB kt xo ei Bx ae xt dg uq im FB ei Bx be zv gk ol pg to kt xo gk ol ho sl ko ls fk so kt wp cg vs nw At rv to mr ol gk lh ko hd vA Dw ot du tA Cz AE zv Em un js qja sv yu im ur
Тоша|Тундра|K|2|kn wt jm vr mv Ark gn tp dg ur nu yr ej xt ae Bx fk FB jn Cy nu yr bf EA ej Av jm zu lo Bw os vo mv ws vA Dw fj ofm iry pl gp sn yC nj Cy je yn eb nF to Fw bk wa ku
Скифи|Каллисто|K|2|jm wt mr vm ir un kr tp lo Bw fk zv cf vm os wn kri FB im Bw mr xt ei ws ae Av rA Ev ej yu fk so bf ur jm Cy fj of jc yu mq vs qz Du cf uq fj rn jm qj gl pg dkr sn rk tp ko jf hl pg os gc sw cl wB lp BF fc FB pt Bx tw xk cf kb wn im nw bf wp fc pA cg Ai gl ie lh eB hz Be zC ea
Каллисто|Скифи|K|2|jm wt mr vm ir un kr tp lo zu fk un kr Bw ei FB gl pg dk Cz ae zu kn wt cf tk fo Bw bf EB ns un sj wt fk Bw jn Av ej tp im wt mq pl qu yr nu ls uy so yC ofm Cs mi sC Dz Cs to sl ie lg xt gc tp cq pl ho eb qc bx cj xo jB oz Be zC eF Cz
Тоша|Аврора|K|2|lo wt jm uq mr vm ir zu hl un kr tk fo Bw gk Cz kn wt cf tk ng FB lo zu fk un kr Bw ej Dz jn zv ae vm ei mj ne Av ej yu gk ur jn EA nu qz bf zu dg uq gl vr fj Av jn wt nu qz lp vr pw zv ot xof im ri wB vs BE sn EB
Аврора|Тоша|K|2|jm ws ej so kt xo ls vo be ur mv Ar jm zv gl Dz ls vo mv zs fj yu jn sj en Bw im EB mr Cy hl oh rv ws vo Bw ot wp ns FB sv pl vA Bw At lg dk hd cg ur tx rn kr dku xB
Эдэон-Профи|Тундра|K|2|jn wt ej ur nu zq jm qj fm Bw mq tp ae FB im Dz mr vm qj Av lo wt jn zu ei vr cf EA fj Av ns uq sz Cv jn yu ns Bw sB xE ox vs bf qm hl sn ko nk gn rkb iry pg dk be
Тундра|Эдэон-Профи|K|2|jn xt lp Bx gl vs lo sl ho Av ej ws nw tA ae FB jm Bw mq vs ov zs qz Du ko sl pg Cz ej zv fk xt gl vs im tp cg Av mq ur ko rm ot mf tAr fc gk pgnu qz yu zq EA qu so uy ok be
Каллисто|Эдэон-Профи|K|2|jn xt lp Bx nr vm ir un kr zv ej vm jq to ae Cz gl EB ls wn ei xt pw Bs dg FB fk zu qz Du kr un bf yu fj ne ib Aw hl wt lp to bf ol pt lh gk Bx kn sj fm xo cg
Эдэон-Профи|Каллисто|K|2|jn xt lp Bx gl vs lo sl pg to kt wp fk FB im Av mq xt hl to ls vof bk ur nu yr ej Bw jn zu qz Du ae EA ej Av gl pg cl vs lp rm jqz Cv pt sj tAr je
Тоша|Скифи|K|2|jn xt lp Bx gl vs dg sj fm ur mv Ar ej zu bf DA lo Av gl EB jn uq nu qz fj vr kn rk of to ls wne ib Bw ae yu ej FB fk zv ko vr be Cz hl uq cf zu os wn js Bw sB xE lo rm ej ur fk mf kb rm pt mj os jf bk qm tw mj kn je wA Evo nr
Скифи|Тоша|K|2|jn xt lp Bx nr vm ir un kr EB ej zu jn Cz ns un sj to jm wt pw Bs ae Av ei FB mq zu qz vC gl yu fk of bk uq cf qm ir sn lp nu hl DA lo Bw ot xo kt ur tx rm pt wp xB Aw Bs mi sw Cy wB ie fj en dh nk hl pg BF
Тундра|Аврора|K|2|jn xt lp Bx gl EB lo ws nw Bsl pg FB hl Bw lp to kt xo ej ol gk lh ko ws fk sl pg uq bf vs gl ho kt zv dg yu tx Aw gl ur lo sl cg lc fk cm kn rk irAt kf xB qm tx fc BF mi
Аврора|Тундра|K|2|jn xt lp Bx gl vs dg sj en ur nu yr fj EB bf zu jn Cy fj to ls uq nu wne aj yr ko Bw gk Av jn FB nu qz im zu cf ur mq Dz ot xo ktA vE pt Bw tA Ev fk vs ko sl ho`.trim().split('\n'), Q=`Скифи|Эдэон-Профи|Q|2|jn xt fj Bx lo FB hl vs ov zs qz Cv dh yu im to kt xo mr vmf bkt sj en Bx ae xo lsB Ex ei Av im uq nr qj rA je|cqDp
Аврора|Каллисто|Q|1|jn vs fj Av jm sj mf ur fj yu jn vs ej wt nw tA lo Av bf EA ae Cy jm Bw gl pgn os vo mvE nk fj wt im kf jc ok EA to Ap FB pl kf cj ok lC ur mv Bw vz ws zD sn js xt Dp yu qz|cqDp
Каллисто|Аврора|Q|2|jn wt ej Aw ae ws nw tA lo Bw kn wt fk Aw ns wn krA tk gn Ev im FB ns vo mr un jsl pg dk Bw hl ws ei so ls zu qz Cvof bk xt|cqDp
Тундра|Тоша|Q|3|jn wt ej Aw ae ws nw tA lo Bw kn wt gk vr dg Av hl EA jm vs ovE FB mv zsjc qz Cv Er cf rn foh nF hl gk lz Fj pl jc lh im tp mr zD cq hd kn pl ei lg bf gc qj Du jq cmE qD dr|cqDp
Тоша|Тундра|Q|3|jn vs fj Av jm sj mf ws ej ur ko yu be EA fk Aw jm wt ej Bw jn sj mf rn krA tkb At xo ls ur sv zs ae rm qj so jn ol ho bt im FB ei tw nr pl gp Bx pt xo rv ok mr kf im fc mq cj ru jf uz fc dh cp qu Cy vA yr At pDq hl qz lo zh|cqDp
Скифи|Каллисто|Q|1|jn vs fj zv ko ur nu qz dh yu bf ur jm Cy mq rn fk nj en sj im je aj zu qzs wne ot xof cja Bw ae Av gk yu lo DA ot ur ei ws hl Aw tA EB pt vE mvo Bx tw|hpFq
Каллисто|Скифи|Q|1|jn vr ej zv lo rm ir vm ae ur nu yr dh Dz ei rn ir nu jn Cy be zv gl vs ov Ar lo qm ei uq nu yr fj mf kb EA bf qm fk rn kr mv cg ws gk sl ho Bw kn xt ox vs nr so ru ok uz kg zD gd Dq ws qD Av Dt dy xB yn BE nr tD so Dz vC Em ok mc kg cl Cz lC|hpFq
Аврора|Тоша|Q|2|jn ur nu yr lo Cy ej zu jm qj fm uq be qj enu yr ae ws gl Bw ej rn kr vmf cj Av jm vr ov rA mq Dz im ws dh EB lo sl|hpFq
Тоша|Аврора|Q|2|jn vs fj zv jm sj mf vr lo Cz ej zv jn vs ovm qjs im uq fj so kt xo ae Dz dh ws ei Bw bf EB gk Bx kt xo mr zu cg une ib yu gk ur kt Av tA vE hl sn fk ng lc rn pt nj cg qm gl mi lo je os EA tw At sv|hpFq
Эдэон-Профи|Тундра|Q|1|jn vs fj zv ko ur nu qz dh yu bf ur jm zu mq Cy qz Du ej rn fk ne aj uq kn qm jq sj ot xo lsz Av zs wn hl EA pt Bw im wp mf Av lo vr os nw qu rm uz mi zC ie fj en Cs wt sj to jm ol mv lh gl ho vh|hpFq
Тундра|Эдэон-Профи|Q|2|jn xt ej Bx ae vs lo sl ns wn pw At gpw ng cl ur dg zv gk Cz im ri wB vs ko zv fk Dz lp sl pg vs gl zv ko xt ox vr lp so BF ok jn kf nu qz bk ibo Fe ov|hpFq
Каллисто|Эдэон-Профи|Q|1|mq rm ir vm kn mi nr un jsB Fw lp ws ej Av gl yu lo sl pg xt gk tp jn EB ko ur nu Bx hl pg dk vs ov zs cg xt fj so bf DA uy Aw qu ws uz Cv yC tp kt pw fk|amBr
Эдэон-Профи|Каллисто|Q|2|mq vs jm rn kr un lo sl ho Av fk vr mv zsl gp ng dk EB cg wt pw Bs gl Cz ej FB im xt jn sj mf tp lo zu qz Du fj ur be yu jn Bw ot rm tA mj ei js AE pl|amBr
Тоша|Скифи|Q|2|mq vs lp so kt xo gk wt pw At jm FB mv zs qz Du im EA mq Cz ei zv qz vC be tp kt pw hl yu ej so ls wne ib Bw cg ur gl ws dg rm lp Aw gl Cz fk zv bf mi fj vr jm sn mv ng lc ws vo ie cf|amBr
Скифи|Тоша|Q|2|mq vs lp so kt xo gk wt pw At jm tp kt pw mv zs qz Cv fk FB im EA hl wt lp to kt Bx tw sB ej Bw jn yu dg wt pw At gl uq lp qjs pwn Dz bf xt cg tp fj zu jm uq nr qj rA|amBr
Тундра|Аврора|Q|2|mq vs lo sl ho wt jn FB fj Aw dh tp ns wn js DA cf Av ej EA jn Bw sB xE be EB ej Bx jm Aw fj vs ov rA mr wt rv Ar hl zv qzs to nu yr kt xoh sw hd jn rk gn dy wB|amBr
Аврора|Тундра|Q|2|mq vs kn rk fov zs qz Du lo sl ho FB gl uq cg wt gk tp kn pg dk Cz os zu im ur mv Ar nu qz kn EA ei yu jm Av mr|amBr`.trim().split('\n');
const T_K='Dasturlar partiyalari · Klassika · 09.02.2011', T_Q='Dasturlar partiyalari · Qura · 09.02.2011', PLACE='Edeon Brazil', YEAR=2011;
const NM=JSON.parse(fs.readFileSync(D+'names.json','utf8'));
for(const k of ['n','t','s']) NM[k]=NM[k]||{};
for(const i in NM.t) if(NM.t[i]===T_K||NM.t[i]===T_Q){console.log('Allaqachon qo\'shilgan');process.exit(0);}
function id(k,name){for(const i in NM[k]) if(NM[k][i]===name) return +i;
  const m=Math.max(0,...Object.keys(NM[k]).map(Number))+1; NM[k][m]=name; return m;}
const s=id('s',PLACE), tk=id('t',T_K), tq=id('t',T_Q);
function row(l,t){const f=l.split('|');return [id('n',f[0]),id('n',f[1]),t,s,YEAR,f[3],f[4]].join('\t')+(f[5]?'\t'+f[5]:'');}
const kl=K.map(l=>row(l,tk)), ql=Q.map(l=>row(l,tq));
let base=zlib.gunzipSync(fs.readFileSync(D+'games.txt.gz')).toString('utf8');
base = base.endsWith('\n') ? base+kl.join('\n')+'\n' : base+'\n'+kl.join('\n');
fs.writeFileSync(D+'games.txt.gz',zlib.gzipSync(Buffer.from(base,'utf8'),{level:9}));
fs.writeFileSync(D+'qura_games.txt',ql.join('\n')+'\n');
fs.writeFileSync(D+'names.json',JSON.stringify(NM));
console.log('OK: klassika',kl.length,'ta; qura',ql.length,'ta (qura_games.txt)');
