import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Image, TextInput, Platform,
  Modal, Linking, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../../../navigation/types';

type NavProp = NativeStackNavigationProp<CustomerStackParamList, 'HotelBooking'>;

// ─── CONSTANTS ───────────────────────────────────────────────
const ORANGE  = '#E9531E';
const ORANGE2 = '#EB5A24';
const { width: SW } = Dimensions.get('window');

const AREA_FILTERS = ['Semua Jogja', 'Malioboro', 'Sleman', 'Prawirotaman', 'Kaliurang'];
const COUPON_TAGS  = ['Pengguna Baru', 'Hotel'];

const HOTELS = [
  {
    id: '1', name: 'Garrya Bianti Yogyakarta', area: 'Sleman', stars: 4,
    score: 8.7, reviews: 266, origPrice: 2150000, price: 1650000, discount: 23,
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  },
  {
    id: '2', name: 'Hyatt Regency Yogyakarta', area: 'Ngaglik', stars: 5,
    score: 8.4, reviews: 251, origPrice: 0, price: 1250000, discount: 0,
    img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
  },
  {
    id: '3', name: 'Pakuwon Hotel Yogyakarta', area: 'Prawirotaman', stars: 4,
    score: 8.2, reviews: 183, origPrice: 0, price: 1180000, discount: 0,
    img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80',
  },
  {
    id: '4', name: 'Grand Aston Hotel', area: 'Malioboro', stars: 5,
    score: 9.1, reviews: 412, origPrice: 2500000, price: 2100000, discount: 16,
    img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
  },
];

// ─── DATE HELPERS ────────────────────────────────────────────
const DAYS   = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
const MSHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MFULL  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const isBetween = (d: Date, s: Date, e: Date) => {
  const t=startOf(d).getTime();
  return t>startOf(s).getTime() && t<startOf(e).getTime();
};
const nights = (a: Date, b: Date) =>
  Math.round((startOf(b).getTime()-startOf(a).getTime())/86400000);
const dow = (d: Date) => { const w=d.getDay(); return w===0?6:w-1; };
const fmtShort = (d: Date) => `${DAYS[dow(d)]}, ${d.getDate()} ${MSHORT[d.getMonth()]}`;
const fmtFull  = (d: Date) => `${fmtShort(d)} ${d.getFullYear()}`;

function buildMonth(y: number, m: number): (Date|null)[][] {
  const first = new Date(y,m,1);
  const off = dow(first);
  const dim = new Date(y,m+1,0).getDate();
  const ws: (Date|null)[][] = [];
  let w: (Date|null)[] = Array(off).fill(null);
  for (let d=1;d<=dim;d++) {
    w.push(new Date(y,m,d));
    if (w.length===7) { ws.push(w); w=[]; }
  }
  if (w.length) { while(w.length<7) w.push(null); ws.push(w); }
  return ws;
}
const buildMonths = (n=8) => {
  const t=new Date();
  return Array.from({length:n},(_,i)=>{const d=new Date(t.getFullYear(),t.getMonth()+i,1);return{y:d.getFullYear(),m:d.getMonth()};});
};

// ─── STAR ROW ────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return (
    <View style={{flexDirection:'row',gap:2}}>
      {Array.from({length:n}).map((_,i)=>(
        <Ionicons key={i} name="star" size={11} color="#FBBF24"/>
      ))}
    </View>
  );
}

// ─── CALENDAR MODAL ──────────────────────────────────────────
function CalendarModal({
  visible, checkIn, checkOut, onConfirm, onClose,
}: {
  visible:boolean; checkIn:Date; checkOut:Date;
  onConfirm:(ci:Date,co:Date)=>void; onClose:()=>void;
}) {
  const today   = startOf(new Date());
  const [tmpIn,  setTmpIn]  = useState(checkIn);
  const [tmpOut, setTmpOut] = useState(checkOut);
  const [step,   setStep]   = useState<'in'|'out'>('in');
  const months = useMemo(()=>buildMonths(8),[]);
  const n = nights(tmpIn, tmpOut);

  const tap = (d: Date) => {
    const ds = startOf(d);
    if (ds.getTime()<today.getTime()) return;
    if (step==='in') { setTmpIn(d); setTmpOut(addDays(d,1)); setStep('out'); }
    else {
      if (ds.getTime()<=startOf(tmpIn).getTime()) { setTmpIn(d); setTmpOut(addDays(d,1)); }
      else { setTmpOut(d); setStep('in'); }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex:1,backgroundColor:'#F8F9FA'}}>
       <StatusBar barStyle="light-content"/>

        {/* Header */}
        <View style={cs.hdr}>
          <Text style={cs.hdrTitle}>Tanggal Menginap</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#fff"/></TouchableOpacity>
        </View>

        {/* Step chips */}
        <View style={cs.stepRow}>
          <TouchableOpacity style={[cs.chip, step==='in'&&cs.chipA]} onPress={()=>setStep('in')}>
            <Ionicons name="enter-outline" size={12} color={step==='in'?ORANGE:'#9CA3AF'}/>
            <Text style={[cs.chipTxt, step==='in'&&cs.chipTxtA]}>Check-In</Text>
          </TouchableOpacity>
          <Ionicons name="arrow-forward" size={13} color="#D1D5DB" style={{marginHorizontal:6}}/>
          <TouchableOpacity style={[cs.chip, step==='out'&&cs.chipA]} onPress={()=>setStep('out')}>
            <Ionicons name="exit-outline" size={12} color={step==='out'?ORANGE:'#9CA3AF'}/>
            <Text style={[cs.chipTxt, step==='out'&&cs.chipTxtA]}>Check-Out</Text>
          </TouchableOpacity>
          {n>0 && (
            <View style={cs.nightBadge}>
              <Text style={cs.nightBadgeTxt}>{n} malam</Text>
            </View>
          )}
        </View>

        {/* Day labels */}
        <View style={cs.dayRow}>
          {DAYS.map(d=>(
            <Text key={d} style={[cs.dayLbl, d==='Min'&&{color:'#EF4444'}]}>{d}</Text>
          ))}
        </View>

        <ScrollView contentContainerStyle={{paddingBottom:120}}>
          {months.map(({y,m})=>{
            const wks = buildMonth(y,m);
            return (
              <View key={`${y}${m}`} style={{paddingHorizontal:4,paddingTop:16}}>
                <Text style={cs.mTitle}>{MFULL[m]} {y}</Text>
                {wks.map((wk,wi)=>(
                  <View key={wi} style={{flexDirection:'row'}}>
                    {wk.map((day,di)=>{
                      if (!day) return <View key={di} style={cs.cell}/>;
                      const past   = startOf(day).getTime()<today.getTime();
                      const isIn   = isSameDay(day,tmpIn);
                      const isOut  = isSameDay(day,tmpOut);
                      const inRng  = isBetween(day,tmpIn,tmpOut);
                      const isToday= isSameDay(day,new Date());
                      const isSun  = day.getDay()===0;
                      return (
                        <TouchableOpacity key={di} style={[cs.cell,inRng&&cs.rng]}
                          onPress={()=>tap(day)} disabled={past} activeOpacity={0.7}>
                          <View style={[cs.inner,(isIn||isOut)&&cs.sel]}>
                            {isToday&&!isIn&&!isOut&&(
                              <View style={cs.todayDot}/>
                            )}
                            <Text style={[
                              cs.dayNum,
                              past&&{color:'#D1D5DB'},
                              isSun&&!isIn&&!isOut&&!past&&{color:'#EF4444'},
                              (isIn||isOut)&&{color:'#fff',fontWeight:'700'},
                              inRng&&!isIn&&!isOut&&{color:ORANGE,fontWeight:'600'},
                            ]}>
                              {day.getDate()}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={cs.foot}>
          <View style={{flex:1}}>
            <Text style={cs.footLbl}>Check-In</Text>
            <Text style={cs.footDate}>{fmtFull(tmpIn)}</Text>
          </View>
          <View style={{width:1,height:34,backgroundColor:'#E5E7EB',marginHorizontal:10}}/>
          <View style={{flex:1}}>
            <Text style={cs.footLbl}>Check-out</Text>
            <Text style={cs.footDate}>{fmtFull(tmpOut)}</Text>
          </View>
          <TouchableOpacity style={cs.footBtn}
            onPress={()=>{ onConfirm(tmpIn,tmpOut); onClose(); }}>
            <Text style={cs.footBtnTxt}>Lanjutkan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const cs = StyleSheet.create({
  hdr:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
       padding:16,backgroundColor:ORANGE},
  hdrTitle:{fontSize:16,fontWeight:'700',color:'#fff'},
  stepRow:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:10,
           backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#F3F4F6'},
  chip:{flexDirection:'row',alignItems:'center',gap:4,borderWidth:1,borderColor:'#E5E7EB',
        borderRadius:20,paddingHorizontal:10,paddingVertical:5},
  chipA:{borderColor:ORANGE,backgroundColor:'#FFF5F0'},
  chipTxt:{fontSize:11,color:'#9CA3AF',fontWeight:'500'},
  chipTxtA:{color:ORANGE,fontWeight:'700'},
  nightBadge:{marginLeft:'auto' as any,backgroundColor:'#FFF5F0',borderRadius:12,
              paddingHorizontal:10,paddingVertical:4},
  nightBadgeTxt:{fontSize:12,fontWeight:'700',color:ORANGE},
  dayRow:{flexDirection:'row',paddingHorizontal:4,paddingVertical:8,
          backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#F3F4F6'},
  dayLbl:{flex:1,textAlign:'center',fontSize:12,fontWeight:'600',color:'#374151'},
  mTitle:{fontSize:13,fontWeight:'700',color:'#111827',marginBottom:6,paddingLeft:8},
  cell:{flex:1,height:46,alignItems:'center',justifyContent:'center'},
  rng:{backgroundColor:'#FEE8E0'},
  inner:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
  sel:{backgroundColor:ORANGE},
  todayDot:{position:'absolute',bottom:4,width:4,height:4,borderRadius:2,backgroundColor:ORANGE},
  dayNum:{fontSize:14,color:'#111827'},
  foot:{position:'absolute',bottom:0,left:0,right:0,flexDirection:'row',alignItems:'center',
        padding:16,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#E5E7EB',gap:8},
  footLbl:{fontSize:10,color:'#6B7280',marginBottom:1},
  footDate:{fontSize:11,fontWeight:'700',color:'#111827'},
  footBtn:{backgroundColor:ORANGE,paddingHorizontal:18,paddingVertical:11,borderRadius:10},
  footBtnTxt:{color:'#fff',fontWeight:'700',fontSize:13},
});

// ─── GUEST MODAL ─────────────────────────────────────────────
function GuestModal({
  visible, rooms, adults, children, onConfirm, onClose,
}: {
  visible:boolean; rooms:number; adults:number; children:number;
  onConfirm:(r:number,a:number,c:number)=>void; onClose:()=>void;
}) {
  const [r,setR] = useState(rooms);
  const [a,setA] = useState(adults);
  const [c,setC] = useState(children);

  const Row = ({icon,label,sub,val,set,min=0}: {icon:string;label:string;sub?:string;val:number;set:(v:number)=>void;min?:number}) => (
    <View style={gs.row}>
      <View style={{flex:1}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Ionicons name={icon as any} size={18} color="#374151"/>
          <Text style={gs.lbl}>{label}</Text>
        </View>
        {sub?<Text style={gs.sub}>{sub}</Text>:null}
      </View>
      <View style={{flexDirection:'row',alignItems:'center',gap:16}}>
        <TouchableOpacity style={[gs.btn,val<=min&&gs.btnOff]} disabled={val<=min}
          onPress={()=>set(Math.max(min,val-1))}>
          <Text style={[gs.btnTxt,val<=min&&{color:'#D1D5DB'}]}>−</Text>
        </TouchableOpacity>
        <Text style={gs.cnt}>{val}</Text>
        <TouchableOpacity style={gs.btn} onPress={()=>set(val+1)}>
          <Text style={gs.btnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex:1,backgroundColor:'#fff'}}>
        <StatusBar barStyle="light-content"/>
        <View style={gs.hdr}>
          <Text style={gs.hdrTxt}>Tambahkan Tamu & Kamar</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#fff"/></TouchableOpacity>
        </View>
        <View style={{padding:20,flex:1}}>
          <Row icon="document-outline" label="Kamar" val={r} set={setR} min={1}/>
          <View style={gs.sep}/>
          <Row icon="people-outline" label="Dewasa" val={a} set={setA} min={1}/>
          <View style={gs.sep}/>
          <Row icon="rocket-outline" label="Anak" sub="Maksimal 17 tahun" val={c} set={setC} min={0}/>
        </View>
        <View style={{padding:16,borderTopWidth:1,borderTopColor:'#E5E7EB'}}>
          <TouchableOpacity style={gs.apply}
            onPress={()=>{ onConfirm(r,a,c); onClose(); }}>
            <Text style={gs.applyTxt}>Terapkan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const gs = StyleSheet.create({
  hdr:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
       padding:16,backgroundColor:ORANGE},
  hdrTxt:{fontSize:16,fontWeight:'700',color:'#fff'},
  row:{flexDirection:'row',alignItems:'center',paddingVertical:18},
  lbl:{fontSize:15,fontWeight:'500',color:'#111827'},
  sub:{fontSize:12,color:'#6B7280',marginTop:3,paddingLeft:26},
  sep:{height:1,backgroundColor:'#F3F4F6'},
  btn:{width:34,height:34,borderRadius:17,borderWidth:1.5,borderColor:ORANGE,
       alignItems:'center',justifyContent:'center'},
  btnOff:{borderColor:'#D1D5DB'},
  btnTxt:{fontSize:18,color:ORANGE,lineHeight:22},
  cnt:{fontSize:16,fontWeight:'600',color:'#111827',minWidth:26,textAlign:'center'},
  apply:{backgroundColor:ORANGE,paddingVertical:14,borderRadius:12,alignItems:'center'},
  applyTxt:{color:'#fff',fontWeight:'700',fontSize:16},
});

// ─── MAP MODAL ───────────────────────────────────────────────
const MAP_Z=13, MAP_CX=6607, MAP_CY=4273;
const LNG_MIN=110.3027, LNG_MAX=110.4346, LAT_T=-7.711, LAT_B=-7.842;
const TILE_GRID=[
  [{x:MAP_CX-1,y:MAP_CY-1},{x:MAP_CX,y:MAP_CY-1},{x:MAP_CX+1,y:MAP_CY-1}],
  [{x:MAP_CX-1,y:MAP_CY  },{x:MAP_CX,y:MAP_CY  },{x:MAP_CX+1,y:MAP_CY  }],
  [{x:MAP_CX-1,y:MAP_CY+1},{x:MAP_CX,y:MAP_CY+1},{x:MAP_CX+1,y:MAP_CY+1}],
];
const MARKERS=[
  {id:'4',name:'Grand Aston',area:'Malioboro',price:2100000,lat:-7.793,lng:110.366,hi:true},
  {id:'1',name:'Garrya Bianti',area:'Sleman',price:1650000,lat:-7.770,lng:110.375,hi:false},
  {id:'2',name:'Hyatt Regency',area:'Ngaglik',price:1250000,lat:-7.755,lng:110.388,hi:false},
  {id:'3',name:'Pakuwon',area:'Prawirotaman',price:1180000,lat:-7.812,lng:110.380,hi:false},
  {id:'5',name:'Hotel Tentrem',area:'Malioboro',price:458874,lat:-7.783,lng:110.393,hi:false},
];
const lp=(lng:number)=>((lng-LNG_MIN)/(LNG_MAX-LNG_MIN))*100;
const tp=(lat:number)=>((lat-LAT_T)/(LAT_B-LAT_T))*100;

function MapModal({visible,checkIn,checkOut,rooms,adults,onClose}:{
  visible:boolean;checkIn:Date;checkOut:Date;rooms:number;adults:number;onClose:()=>void;
}) {
  const [sel,setSel]=useState(MARKERS[0]);
  const ts = Math.ceil(SW/3);
  const mh = ts*3;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex:1,backgroundColor:'#F8F9FA'}}>
        <StatusBar barStyle="dark-content"/>
        <View style={ms.hdr}>
          <TouchableOpacity onPress={onClose} style={{padding:4}}>
            <Ionicons name="arrow-back" size={22} color="#111827"/>
          </TouchableOpacity>
          <View style={{flex:1,marginLeft:10}}>
            <Text style={ms.hdrTitle}>Di sekitar saya ({MARKERS.length*189} Properti)</Text>
            <Text style={ms.hdrSub}>{fmtShort(checkIn)} – {fmtShort(checkOut)} · {rooms} kamar, {adults} tamu</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#374151"/>
        </View>

        <View style={{height:mh,overflow:'hidden'}}>
          {TILE_GRID.map((row,ri)=>(
            <View key={ri} style={{flexDirection:'row'}}>
              {row.map((t,ci)=>(
                <Image key={ci} style={{width:ts,height:ts}}
                  source={{uri:`https://tile.openstreetmap.org/${MAP_Z}/${t.x}/${t.y}.png`}}
                  resizeMode="cover"/>
              ))}
            </View>
          ))}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {MARKERS.map(h=>(
              <TouchableOpacity key={h.id} onPress={()=>setSel(h)}
                style={[ms.mWrap,{left:SW*lp(h.lng)/100-46,top:mh*tp(h.lat)/100-18}]}>
                <View style={[ms.mBadge,h.hi||sel.id===h.id?ms.mBadgeO:ms.mBadgeG]}>
                  <Text style={ms.mTxt}>Rp {h.price.toLocaleString('id-ID')}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={[ms.dot,{left:SW*lp(110.365)/100-10,top:mh*tp(-7.797)/100-10}]}>
              <View style={ms.dotO}/><View style={ms.dotI}/>
            </View>
          </View>
          <TouchableOpacity style={ms.searchBtn}
            onPress={()=>Linking.openURL('https://www.google.com/maps/search/hotel+yogyakarta/@-7.797,110.365,14z')}>
            <Ionicons name="refresh" size={13} color="#fff"/>
            <Text style={ms.searchBtnTxt}>Cari di area ini</Text>
          </TouchableOpacity>
          <View style={ms.attr}><Text style={ms.attrTxt}>© OpenStreetMap</Text></View>
        </View>

        <View style={{backgroundColor:'#F8F9FA',paddingVertical:10}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal:16,gap:12}}>
            {MARKERS.map(h=>(
              <TouchableOpacity key={h.id}
                style={[ms.card,sel.id===h.id&&ms.cardSel]} onPress={()=>setSel(h)}>
                <View style={ms.cardImg}>
                  <Ionicons name="bed-outline" size={26} color="#9CA3AF"/>
                </View>
                <View style={{flex:1}}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:2}}>
                    <Ionicons name="location-outline" size={9} color="#6B7280"/>
                    <Text style={{fontSize:9,color:'#6B7280'}}>{h.area}</Text>
                  </View>
                  <Text style={ms.cardName} numberOfLines={1}>{h.name}</Text>
                  <Text style={ms.cardDist}>2.1 km dari Lokasi Sekarang</Text>
                  <Text style={ms.cardPrice}>Rp {h.price.toLocaleString('id-ID')}/malam</Text>
                </View>
                <Ionicons name="shield-checkmark" size={16} color="#2563EB" style={{alignSelf:'center'}}/>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={ms.bar}>
          <TouchableOpacity style={ms.barBtn}>
            <Ionicons name="options-outline" size={17} color="#374151"/>
            <Text style={ms.barBtnTxt}>Filter</Text>
          </TouchableOpacity>
          <View style={{width:1,height:22,backgroundColor:'#E5E7EB'}}/>
          <TouchableOpacity style={ms.barBtn}>
            <Ionicons name="list-outline" size={17} color="#374151"/>
            <Text style={ms.barBtnTxt}>Daftar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const ms = StyleSheet.create({
  hdr:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:12,
       backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#E5E7EB'},
  hdrTitle:{fontSize:13,fontWeight:'700',color:'#111827'},
  hdrSub:{fontSize:11,color:'#6B7280',marginTop:1},
  mWrap:{position:'absolute',zIndex:10},
  mBadge:{borderRadius:7,paddingHorizontal:9,paddingVertical:5,elevation:5,
          shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.22,shadowRadius:3},
  mBadgeO:{backgroundColor:ORANGE},
  mBadgeG:{backgroundColor:'#16A34A'},
  mTxt:{color:'#fff',fontSize:10,fontWeight:'700'},
  dot:{position:'absolute',width:20,height:20,alignItems:'center',justifyContent:'center'},
  dotO:{position:'absolute',width:20,height:20,borderRadius:10,backgroundColor:'rgba(37,99,235,0.2)'},
  dotI:{width:10,height:10,borderRadius:5,backgroundColor:'#2563EB',borderWidth:2,borderColor:'#fff'},
  searchBtn:{
    position:'absolute',top:12,left:SW/2-72,
    flexDirection:'row',alignItems:'center',gap:5,
    backgroundColor:'#2563EB',borderRadius:20,paddingHorizontal:14,paddingVertical:7,
    elevation:5,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.18,shadowRadius:4,
  },
  searchBtnTxt:{color:'#fff',fontSize:12,fontWeight:'600'},
  attr:{position:'absolute',bottom:5,left:7,backgroundColor:'rgba(255,255,255,0.8)',
        paddingHorizontal:4,paddingVertical:1,borderRadius:3},
  attrTxt:{fontSize:8,color:'#374151'},
  card:{width:260,flexDirection:'row',backgroundColor:'#fff',borderRadius:14,padding:12,
        alignItems:'center',gap:10,borderWidth:1.5,borderColor:'transparent',
        shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.07,shadowRadius:5,elevation:3},
  cardSel:{borderColor:ORANGE},
  cardImg:{width:62,height:62,borderRadius:10,backgroundColor:'#F3F4F6',
           alignItems:'center',justifyContent:'center',flexShrink:0},
  cardName:{fontSize:12,fontWeight:'700',color:'#111827'},
  cardDist:{fontSize:10,color:'#6B7280',marginTop:1},
  cardPrice:{fontSize:11,fontWeight:'700',color:ORANGE,marginTop:3},
  bar:{flexDirection:'row',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#E5E7EB',
       paddingVertical:12,justifyContent:'space-evenly',alignItems:'center'},
  barBtn:{flexDirection:'row',alignItems:'center',gap:6},
  barBtnTxt:{fontSize:14,fontWeight:'600',color:'#374151'},
});

// ─── MAIN SCREEN ─────────────────────────────────────────────
export default function HotelBookingScreen() {
  const nav = useNavigation<NavProp>();
  const today = new Date();

  const [dest,  setDest]  = useState('Yogyakarta (DIY), Indonesia');
  const [ci,    setCi]    = useState<Date>(today);
  const [co,    setCo]    = useState<Date>(addDays(today,1));
  const [rm,    setRm]    = useState(1);
  const [ad,    setAd]    = useState(2);
  const [ch,    setCh]    = useState(0);

  const [calV, setCalV] = useState(false);
  const [gstV, setGstV] = useState(false);
  const [mapV, setMapV] = useState(false);

  const [area,   setArea]   = useState('Semua Jogja');
  const [coupon, setCoupon] = useState('Pengguna Baru');

  const n = nights(ci,co);
  const dateLbl  = `${fmtShort(ci)} – ${fmtShort(co)} (${n} malam)`;
  const guestLbl = `${rm} kamar, ${ad} dewasa, ${ch} anak`;
  const filtered = area==='Semua Jogja' ? HOTELS : HOTELS.filter(h=>h.area===area);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content"/>

      <CalendarModal visible={calV} checkIn={ci} checkOut={co}
        onConfirm={(a,b)=>{setCi(a);setCo(b);}} onClose={()=>setCalV(false)}/>
      <GuestModal visible={gstV} rooms={rm} adults={ad} children={ch}
        onConfirm={(r,a,c)=>{setRm(r);setAd(a);setCh(c);}} onClose={()=>setGstV(false)}/>
      <MapModal visible={mapV} checkIn={ci} checkOut={co} rooms={rm} adults={ad}
        onClose={()=>setMapV(false)}/>

      {/* ── HEADER ── */}
      <View style={s.hdr}>
        <TouchableOpacity onPress={()=>nav.goBack()} style={{padding:4,marginLeft:-4}}>
          <Ionicons name="arrow-back" size={22} color="#111827"/>
        </TouchableOpacity>
        <Text style={s.hdrTitle}>Hotel & Akomodasi Jogja</Text>
        <TouchableOpacity style={{padding:4,marginRight:-4}}>
          <Ionicons name="ellipsis-vertical" size={20} color="#111827"/>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal:16,paddingTop:14,paddingBottom:36,gap:14}}>

        {/* ── SEARCH CARD ── */}
        <View style={s.card}>
          {/* Destination */}
          <View style={{paddingBottom:12,borderBottomWidth:1,borderBottomColor:'#F3F4F6'}}>
            <Text style={s.cardCaption}>TUJUAN / AREA</Text>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <Ionicons name="location-outline" size={18} color="#9CA3AF"/>
                <Text style={s.destTxt}>{dest}</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={14} color="#9CA3AF"/>
            </View>
          </View>

          {/* Date & Guest row */}
          <View style={{flexDirection:'row',paddingVertical:12,
                        borderBottomWidth:1,borderBottomColor:'#F3F4F6'}}>
            {/* Date */}
            <TouchableOpacity style={{flex:1,paddingRight:12}} onPress={()=>setCalV(true)} activeOpacity={0.7}>
              <View style={{flexDirection:'row',alignItems:'center',gap:5,marginBottom:4}}>
                <Ionicons name="calendar-outline" size={12} color="#9CA3AF"/>
                <Text style={s.fieldLabel}>Tanggal Menginap</Text>
              </View>
              <Text style={s.fieldVal} numberOfLines={2}>{dateLbl}</Text>
            </TouchableOpacity>
            <View style={{width:1,backgroundColor:'#F3F4F6',marginRight:12}}/>
            {/* Guest */}
            <TouchableOpacity style={{flex:1}} onPress={()=>setGstV(true)} activeOpacity={0.7}>
              <View style={{flexDirection:'row',alignItems:'center',gap:5,marginBottom:4}}>
                <Ionicons name="people-outline" size={12} color="#9CA3AF"/>
                <Text style={s.fieldLabel}>Tamu & Kamar</Text>
              </View>
              <Text style={s.fieldVal} numberOfLines={2}>{guestLbl}</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={{flexDirection:'row',gap:10,paddingTop:12}}>
            <TouchableOpacity style={s.mapBtn} onPress={()=>setMapV(true)}>
              <Ionicons name="map-outline" size={15} color={ORANGE}/>
              <Text style={s.mapBtnTxt}>Peta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.searchBtn}>
              <Text style={s.searchBtnTxt}>Cari</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── GUARANTEE BANNER ── */}
        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <Ionicons name="thumbs-up" size={14} color="#fff"/>
          </View>
          <Text style={s.bannerTxt}>
            Ketemu harga lebih hemat? Klaim selisihnya dengan Best Price Guarantee.
          </Text>
        </View>

        {/* ── COUPON SECTION ── */}
        <View style={{gap:10}}>
          <Text style={s.sectionTitle}>Pakai Kupon Lebih Hemat</Text>
          {/* Filter tabs */}
          <View style={{flexDirection:'row',gap:8}}>
            {COUPON_TAGS.map(t=>(
              <TouchableOpacity key={t} onPress={()=>setCoupon(t)}
                style={[s.couponTag, coupon===t&&s.couponTagA]}>
                <Text style={[s.couponTagTxt, coupon===t&&s.couponTagTxtA]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Coupon card */}
          <View style={s.couponCard}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <Text style={{fontSize:10,color:'#9CA3AF'}}>Hotel / Xperience / Rental Mobil...</Text>
              <Ionicons name="information-circle-outline" size={15} color="#9CA3AF"/>
            </View>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <View style={{flexDirection:'row',alignItems:'flex-start',gap:12,flex:1}}>
                <View style={s.couponIcon}>
                  <Ionicons name="pricetag" size={18} color="#0064D2" style={{transform:[{rotate:'-45deg'}]}}/>
                </View>
                <View>
                  <Text style={s.couponName}>Diskon s.d. Rp 300rb</Text>
                  <Text style={s.couponDesc}>Hanya berlaku untuk Pengguna Baru</Text>
                  <Text style={s.couponStock}>Stok terbatas</Text>
                  <View style={s.stockBar}>
                    <View style={[s.stockFill,{width:'58%'}]}/>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={s.claimBtn}>
                <Text style={s.claimBtnTxt}>Klaim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── HOTEL PROMO ── */}
        <View style={{gap:10}}>
          <Text style={s.sectionTitle}>Promo Hotel Jogja Untukmu</Text>
          {/* Area chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{marginHorizontal:-16}} contentContainerStyle={{paddingHorizontal:16,gap:8}}>
            {AREA_FILTERS.map(a=>(
              <TouchableOpacity key={a} onPress={()=>setArea(a)}
                style={[s.areaChip, area===a&&s.areaChipA]}>
                <Text style={[s.areaChipTxt, area===a&&s.areaChipTxtA]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Hotel cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{marginHorizontal:-16}} contentContainerStyle={{paddingHorizontal:16,gap:12,paddingBottom:4}}>
            {filtered.map(h=>(
              <TouchableOpacity key={h.id} style={s.hotelCard}>
                {/* Image */}
                <View style={{position:'relative',height:128}}>
                  <Image source={{uri:h.img}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
                  {h.discount>0&&(
                    <View style={s.discBadge}>
                      <Text style={s.discBadgeTxt}>Hemat {h.discount}%</Text>
                    </View>
                  )}
                  <TouchableOpacity style={s.saveBtn}>
                    <Ionicons name="bookmark-outline" size={14} color="#374151"/>
                  </TouchableOpacity>
                </View>
                {/* Info */}
                <View style={{padding:10,flex:1}}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:3,marginBottom:3}}>
                    <Ionicons name="location-outline" size={10} color="#9CA3AF"/>
                    <Text style={{fontSize:10,color:'#9CA3AF'}}>{h.area}</Text>
                  </View>
                  <Text style={s.hotelName} numberOfLines={1}>{h.name}</Text>
                  <Stars n={h.stars}/>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:6}}>
                    <View style={s.scoreBadge}>
                      <Text style={s.scoreTxt}>{h.score}</Text>
                    </View>
                    <Text style={{fontSize:10,color:'#6B7280'}}>{h.reviews} ulasan</Text>
                  </View>
                </View>
                {/* Price */}
                <View style={{paddingHorizontal:10,paddingBottom:10}}>
                  {h.origPrice>0&&(
                    <Text style={s.origPrice}>Rp {h.origPrice.toLocaleString('id-ID')}</Text>
                  )}
                  <Text style={s.price}>Rp {h.price.toLocaleString('id-ID')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── MAIN STYLES ─────────────────────────────────────────────
const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F8F9FA'},
  hdr:{
    flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    paddingHorizontal:16,paddingVertical:13,
    backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#F3F4F6',
  },
  hdrTitle:{fontSize:15,fontWeight:'700',color:'#111827',letterSpacing:-0.3},

  /* Search card */
  card:{
    backgroundColor:'#fff',borderRadius:16,padding:16,
    borderWidth:1,borderColor:'rgba(0,0,0,0.06)',
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.04,shadowRadius:8,elevation:2,
  },
  cardCaption:{fontSize:10,fontWeight:'700',color:'#6B7280',letterSpacing:0.8,marginBottom:6},
  destTxt:{fontSize:14,fontWeight:'600',color:'#1D2939'},
  fieldLabel:{fontSize:10,fontWeight:'500',color:'#6B7280'},
  fieldVal:{fontSize:12,fontWeight:'600',color:'#1D2939',lineHeight:17},
  mapBtn:{
    flexDirection:'row',alignItems:'center',gap:6,
    borderWidth:1.5,borderColor:ORANGE,borderRadius:10,
    paddingHorizontal:16,paddingVertical:10,
  },
  mapBtnTxt:{color:ORANGE,fontWeight:'700',fontSize:13},
  searchBtn:{
    flex:1,backgroundColor:ORANGE,borderRadius:10,
    alignItems:'center',paddingVertical:10,
    shadowColor:ORANGE,shadowOffset:{width:0,height:3},shadowOpacity:0.3,shadowRadius:6,elevation:3,
  },
  searchBtnTxt:{color:'#fff',fontWeight:'700',fontSize:14},

  /* Banner */
  banner:{
    backgroundColor:ORANGE2,borderRadius:12,
    paddingHorizontal:14,paddingVertical:11,
    flexDirection:'row',alignItems:'center',gap:10,
  },
  bannerIcon:{
    width:26,height:26,borderRadius:13,backgroundColor:'rgba(255,255,255,0.22)',
    alignItems:'center',justifyContent:'center',flexShrink:0,
  },
  bannerTxt:{color:'#fff',fontSize:12,fontWeight:'500',flex:1,lineHeight:17},

  /* Sections */
  sectionTitle:{fontSize:14,fontWeight:'700',color:'#111827',letterSpacing:-0.2},

  /* Coupon */
  couponTag:{
    borderWidth:1.5,borderColor:'#D1D5DB',borderRadius:20,
    paddingHorizontal:14,paddingVertical:6,backgroundColor:'#fff',
  },
  couponTagA:{borderColor:ORANGE,backgroundColor:'#FFF5F0'},
  couponTagTxt:{fontSize:12,color:'#6B7280',fontWeight:'500'},
  couponTagTxtA:{color:ORANGE,fontWeight:'700'},
  couponCard:{
    backgroundColor:'#fff',borderRadius:16,padding:14,
    borderWidth:1,borderColor:'rgba(0,0,0,0.06)',
    shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.04,shadowRadius:5,elevation:1,
  },
  couponIcon:{
    width:40,height:40,borderRadius:10,backgroundColor:'#EBF3FF',
    alignItems:'center',justifyContent:'center',flexShrink:0,
  },
  couponName:{fontSize:13,fontWeight:'700',color:'#111827'},
  couponDesc:{fontSize:11,color:'#6B7280',marginTop:2},
  couponStock:{fontSize:10,fontWeight:'700',color:'#EF4444',marginTop:5},
  stockBar:{width:96,height:4,backgroundColor:'#F3F4F6',borderRadius:4,marginTop:4,overflow:'hidden'},
  stockFill:{height:'100%',backgroundColor:'#00AA5B',borderRadius:4},
  claimBtn:{
    borderWidth:1.5,borderColor:'#0064D2',borderRadius:8,
    paddingHorizontal:16,paddingVertical:7,
  },
  claimBtnTxt:{color:'#0064D2',fontWeight:'700',fontSize:12},

  /* Area chips */
  areaChip:{
    borderWidth:1.5,borderColor:'#E5E7EB',borderRadius:20,backgroundColor:'#fff',
    paddingHorizontal:14,paddingVertical:7,flexShrink:0,
  },
  areaChipA:{backgroundColor:ORANGE2,borderColor:ORANGE2},
  areaChipTxt:{fontSize:12,color:'#374151',fontWeight:'500'},
  areaChipTxtA:{color:'#fff',fontWeight:'700'},

  /* Hotel cards */
  hotelCard:{
    width:220,backgroundColor:'#fff',borderRadius:16,overflow:'hidden',flexShrink:0,
    borderWidth:1,borderColor:'rgba(0,0,0,0.07)',
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:6,elevation:2,
  },
  discBadge:{
    position:'absolute',bottom:8,left:8,backgroundColor:ORANGE2,
    borderRadius:5,paddingHorizontal:7,paddingVertical:3,
  },
  discBadgeTxt:{color:'#fff',fontSize:10,fontWeight:'700'},
  saveBtn:{
    position:'absolute',top:8,right:8,width:28,height:28,borderRadius:14,
    backgroundColor:'rgba(255,255,255,0.9)',alignItems:'center',justifyContent:'center',
  },
  hotelName:{fontSize:12,fontWeight:'700',color:'#111827',marginBottom:3},
  scoreBadge:{backgroundColor:ORANGE2,borderRadius:5,paddingHorizontal:6,paddingVertical:3},
  scoreTxt:{color:'#fff',fontSize:11,fontWeight:'700'},
  origPrice:{fontSize:10,color:'#9CA3AF',textDecorationLine:'line-through',marginBottom:2},
  price:{fontSize:14,fontWeight:'700',color:ORANGE},
});