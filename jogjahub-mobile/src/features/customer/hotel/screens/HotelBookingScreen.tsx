import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  Platform,
  Modal,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../../../navigation/types';

type NavProp = NativeStackNavigationProp<CustomerStackParamList, 'HotelBooking'>;

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const ORANGE = '#EA580C';
const { width: SCREEN_W } = Dimensions.get('window');

const AREA_FILTERS = ['Semua Jogja', 'Malioboro', 'Sleman', 'Prawirotaman', 'Kaliurang'];
const COUPON_TAGS = ['Pengguna Baru', 'Hotel'];

const HOTELS = [
  {
    id: '1', name: 'Garrya Bianti Yogyakarta', area: 'Sleman', stars: 4,
    reviewScore: 8.7, reviewCount: 266, originalPrice: 2150000, discountPrice: 1650000, discountPercent: 23,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
  },
  {
    id: '2', name: 'Hyatt Regency Yogyakarta', area: 'Ngaglik', stars: 5,
    reviewScore: 8.4, reviewCount: 251, originalPrice: 1800000, discountPrice: 1250000, discountPercent: 0,
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400',
  },
  {
    id: '3', name: 'Pakuwon Hotel Yogyakarta', area: 'Prawirotaman', stars: 4,
    reviewScore: 8.2, reviewCount: 183, originalPrice: 1500000, discountPrice: 1180000, discountPercent: 0,
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
  },
  {
    id: '4', name: 'Grand Aston Hotel', area: 'Malioboro', stars: 5,
    reviewScore: 9.1, reviewCount: 412, originalPrice: 2500000, discountPrice: 2100000, discountPercent: 16,
    imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400',
  },
];

// ─────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────
const DAYS_SHORT   = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MONTHS_FULL  = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function isSameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function isBetween(d: Date, s: Date, e: Date) {
  const t = startOf(d).getTime();
  return t > startOf(s).getTime() && t < startOf(e).getTime();
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function nightsBetween(a: Date, b: Date) {
  return Math.round((startOf(b).getTime()-startOf(a).getTime())/86400000);
}
function dayOfWeekIdx(d: Date) { const w=d.getDay(); return w===0?6:w-1; } // 0=Mon
function formatShort(d: Date) {
  return `${DAYS_SHORT[dayOfWeekIdx(d)]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
function formatFull(d: Date) { return `${formatShort(d)} ${d.getFullYear()}`; }

function buildMonth(year: number, month: number): (Date|null)[][] {
  const first = new Date(year, month, 1);
  const offset = dayOfWeekIdx(first);
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const weeks: (Date|null)[][] = [];
  let week: (Date|null)[] = Array(offset).fill(null);
  for (let d=1; d<=daysInMonth; d++) {
    week.push(new Date(year, month, d));
    if (week.length===7) { weeks.push(week); week=[]; }
  }
  if (week.length>0) { while (week.length<7) week.push(null); weeks.push(week); }
  return weeks;
}

function buildMonthList(count=8): {year:number;month:number}[] {
  const today = new Date();
  return Array.from({length:count},(_,i)=>{
    const d = new Date(today.getFullYear(), today.getMonth()+i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
}

// ─────────────────────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────────────────────
function StarRating({ count }: { count: number }) {
  return (
    <View style={{flexDirection:'row',gap:2}}>
      {Array.from({length:count}).map((_,i)=>(
        <Ionicons key={i} name="star" size={10} color="#FBBF24" />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// CALENDAR MODAL  — Orange header, flexible range
// ─────────────────────────────────────────────────────────────
interface CalendarModalProps {
  visible: boolean;
  checkIn: Date;
  checkOut: Date;
  onConfirm: (ci: Date, co: Date) => void;
  onClose: () => void;
}

function CalendarModal({ visible, checkIn, checkOut, onConfirm, onClose }: CalendarModalProps) {
  const todayStart = startOf(new Date());

  const [tmpIn,  setTmpIn]  = useState<Date>(checkIn);
  const [tmpOut, setTmpOut] = useState<Date>(checkOut);
  // 'in' = user sedang memilih check-in; 'out' = sudah pilih check-in, lanjut check-out
  const [step, setStep] = useState<'in'|'out'>('in');

  const months = useMemo(()=>buildMonthList(8),[]);
  const nights = nightsBetween(tmpIn, tmpOut);

  const handleDayPress = (d: Date) => {
    const dStart = startOf(d);
    if (dStart.getTime() < todayStart.getTime()) return; // hari lalu diabaikan

    if (step === 'in') {
      // Pilih check-in → geser check-out ke hari berikutnya, tunggu pilihan user
      setTmpIn(d);
      setTmpOut(addDays(d,1));
      setStep('out');
    } else {
      // Pilih check-out
      if (dStart.getTime() <= startOf(tmpIn).getTime()) {
        // Jika pilih sebelum atau sama dengan check-in → reset ke check-in baru
        setTmpIn(d);
        setTmpOut(addDays(d,1));
        setStep('out');
      } else {
        // Tetapkan check-out
        setTmpOut(d);
        setStep('in'); // siap pilih lagi atau konfirmasi
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex:1, backgroundColor:'#F9FAFB'}}>
        <StatusBar barStyle="light-content" backgroundColor={ORANGE} />

        {/* Header — ORANGE */}
        <View style={calSt.header}>
          <Text style={calSt.headerTitle}>Tanggal Menginap</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={calSt.stepRow}>
          <View style={[calSt.stepChip, step==='in' && calSt.stepChipActive]}>
            <Ionicons name="enter-outline" size={13} color={step==='in'?ORANGE:'#6B7280'} />
            <Text style={[calSt.stepText, step==='in' && {color:ORANGE}]}>
              Pilih Check-In
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={14} color="#D1D5DB" style={{marginHorizontal:6}} />
          <View style={[calSt.stepChip, step==='out' && calSt.stepChipActive]}>
            <Ionicons name="exit-outline" size={13} color={step==='out'?ORANGE:'#6B7280'} />
            <Text style={[calSt.stepText, step==='out' && {color:ORANGE}]}>
              Pilih Check-Out
            </Text>
          </View>
          {nights > 0 && (
            <Text style={calSt.nightsText}>{nights} malam</Text>
          )}
        </View>

        {/* Day-of-week labels */}
        <View style={calSt.dayLabels}>
          {DAYS_SHORT.map(d=>(
            <Text key={d} style={[calSt.dayLabel, d==='Min'&&{color:'#EF4444'}]}>{d}</Text>
          ))}
        </View>

        <ScrollView contentContainerStyle={{paddingBottom:120}}>
          {months.map(({year,month})=>{
            const weeks = buildMonth(year, month);
            return (
              <View key={`${year}-${month}`} style={calSt.monthBlock}>
                <Text style={calSt.monthTitle}>{MONTHS_FULL[month]} {year}</Text>
                {weeks.map((week,wi)=>(
                  <View key={wi} style={calSt.week}>
                    {week.map((day,di)=>{
                      if (!day) return <View key={di} style={calSt.dayCell}/>;
                      const dStart = startOf(day);
                      const isPast   = dStart.getTime() < todayStart.getTime();
                      const isIn     = isSameDay(day, tmpIn);
                      const isOut    = isSameDay(day, tmpOut);
                      const inRange  = isBetween(day, tmpIn, tmpOut);
                      const isToday  = isSameDay(day, new Date());
                      const isSun    = day.getDay() === 0;
                      // Left/right cap shape for range
                      const isFirst  = di===0 || !week[di-1];
                      const isLast   = di===6 || !week[di+1];
                      const nextInRange = di<6 && week[di+1] && !isSameDay(week[di+1]!, tmpOut) && isBetween(week[di+1]!, tmpIn, tmpOut);
                      const prevInRange = di>0 && week[di-1] && isBetween(week[di-1]!, tmpIn, tmpOut);
                      return (
                        <TouchableOpacity
                          key={di}
                          style={[calSt.dayCell, inRange && calSt.rangeCell]}
                          onPress={()=>handleDayPress(day)}
                          disabled={isPast}
                          activeOpacity={0.7}
                        >
                          <View style={[calSt.dayInner, (isIn||isOut) && calSt.selectedInner]}>
                            {isToday && !isIn && !isOut && (
                              <Text style={calSt.todayDot}>•</Text>
                            )}
                            <Text style={[
                              calSt.dayText,
                              isPast && {color:'#D1D5DB'},
                              isSun && !isIn && !isOut && !isPast && {color:'#EF4444'},
                              (isIn||isOut) && {color:'#FFF', fontWeight:'700'},
                              inRange && !isIn && !isOut && {color:ORANGE, fontWeight:'600'},
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

        {/* Footer — dinamis update saat pilih tanggal */}
        <View style={calSt.footer}>
          <View style={{flex:1}}>
            <Text style={calSt.footerLabel}>Check-In</Text>
            <Text style={calSt.footerDate}>{formatFull(tmpIn)}</Text>
          </View>
          <View style={calSt.footerSep}/>
          <View style={{flex:1}}>
            <Text style={calSt.footerLabel}>Check-out</Text>
            <Text style={calSt.footerDate}>{formatFull(tmpOut)}</Text>
          </View>
          <TouchableOpacity
            style={calSt.confirmBtn}
            onPress={()=>{ onConfirm(tmpIn, tmpOut); onClose(); }}
          >
            <Text style={calSt.confirmBtnText}>Lanjutkan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const calSt = StyleSheet.create({
  header:{
    flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    padding:16,backgroundColor:ORANGE,
  },
  headerTitle:{fontSize:16,fontWeight:'700',color:'#FFF'},
  stepRow:{
    flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:10,
    backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:'#F3F4F6',
  },
  stepChip:{
    flexDirection:'row',alignItems:'center',gap:4,
    borderWidth:1,borderColor:'#E5E7EB',borderRadius:20,
    paddingHorizontal:10,paddingVertical:5,
  },
  stepChipActive:{borderColor:ORANGE,backgroundColor:'#FFF7F0'},
  stepText:{fontSize:11,color:'#6B7280',fontWeight:'500'},
  nightsText:{
    marginLeft:'auto',fontSize:12,fontWeight:'700',color:ORANGE,
    backgroundColor:'#FFF7F0',paddingHorizontal:10,paddingVertical:4,borderRadius:12,
  },
  dayLabels:{
    flexDirection:'row',paddingHorizontal:4,paddingVertical:8,
    backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:'#F3F4F6',
  },
  dayLabel:{flex:1,textAlign:'center',fontSize:12,fontWeight:'600',color:'#374151'},
  monthBlock:{paddingHorizontal:4,paddingTop:18},
  monthTitle:{fontSize:14,fontWeight:'700',color:'#111827',marginBottom:6,paddingLeft:8},
  week:{flexDirection:'row'},
  dayCell:{flex:1,height:48,alignItems:'center',justifyContent:'center'},
  rangeCell:{backgroundColor:'#FEE2D5'},
  dayInner:{
    width:38,height:38,borderRadius:19,
    alignItems:'center',justifyContent:'center',
  },
  selectedInner:{backgroundColor:ORANGE},
  todayDot:{
    position:'absolute',bottom:3,fontSize:14,color:ORANGE,lineHeight:14,
  },
  dayText:{fontSize:14,color:'#111827'},
  footer:{
    position:'absolute',bottom:0,left:0,right:0,
    flexDirection:'row',alignItems:'center',
    padding:16,backgroundColor:'#FFF',
    borderTopWidth:1,borderTopColor:'#E5E7EB',gap:8,
  },
  footerLabel:{fontSize:11,color:'#6B7280',marginBottom:2},
  footerDate:{fontSize:11,fontWeight:'700',color:'#111827'},
  footerSep:{width:1,height:36,backgroundColor:'#E5E7EB'},
  confirmBtn:{backgroundColor:ORANGE,paddingHorizontal:20,paddingVertical:12,borderRadius:8},
  confirmBtnText:{color:'#FFF',fontWeight:'700',fontSize:14},
});

// ─────────────────────────────────────────────────────────────
// GUEST MODAL  — Orange header
// ─────────────────────────────────────────────────────────────
interface GuestModalProps {
  visible: boolean;
  rooms: number; adults: number; children: number;
  onConfirm: (r:number,a:number,c:number)=>void;
  onClose: ()=>void;
}
function GuestModal({ visible,rooms,adults,children,onConfirm,onClose }: GuestModalProps) {
  const [tmpRooms,setTmpRooms]       = useState(rooms);
  const [tmpAdults,setTmpAdults]     = useState(adults);
  const [tmpChildren,setTmpChildren] = useState(children);

  interface CProps { icon:string;label:string;sub?:string;value:number;onChange:(v:number)=>void;min?:number }
  const Counter = ({icon,label,sub,value,onChange,min=0}: CProps) => (
    <View style={gSt.row}>
      <View style={{flex:1}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Ionicons name={icon as any} size={18} color="#374151"/>
          <Text style={gSt.label}>{label}</Text>
        </View>
        {sub ? <Text style={gSt.sub}>{sub}</Text> : null}
      </View>
      <View style={{flexDirection:'row',alignItems:'center',gap:14}}>
        <TouchableOpacity style={[gSt.btn,value<=min&&gSt.btnDis]} onPress={()=>onChange(Math.max(min,value-1))} disabled={value<=min}>
          <Text style={[gSt.btnTxt,value<=min&&{color:'#D1D5DB'}]}>−</Text>
        </TouchableOpacity>
        <Text style={gSt.count}>{value}</Text>
        <TouchableOpacity style={gSt.btn} onPress={()=>onChange(value+1)}>
          <Text style={gSt.btnTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex:1,backgroundColor:'#FFF'}}>
        <StatusBar barStyle="light-content" backgroundColor={ORANGE}/>
        <View style={gSt.header}>
          <Text style={gSt.headerTitle}>Tambahkan Tamu & Kamar</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#FFF"/></TouchableOpacity>
        </View>
        <View style={{padding:20,flex:1}}>
          <Counter icon="document-outline" label="Kamar" value={tmpRooms} onChange={setTmpRooms} min={1}/>
          <View style={gSt.div}/>
          <Counter icon="people-outline" label="Dewasa" value={tmpAdults} onChange={setTmpAdults} min={1}/>
          <View style={gSt.div}/>
          <Counter icon="rocket-outline" label="Anak" sub="Maksimal 17 tahun" value={tmpChildren} onChange={setTmpChildren} min={0}/>
        </View>
        <View style={gSt.footer}>
          <TouchableOpacity style={gSt.confirmBtn} onPress={()=>{ onConfirm(tmpRooms,tmpAdults,tmpChildren); onClose(); }}>
            <Text style={gSt.confirmBtnTxt}>Terapkan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
const gSt = StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,backgroundColor:ORANGE},
  headerTitle:{fontSize:16,fontWeight:'700',color:'#FFF'},
  row:{flexDirection:'row',alignItems:'center',paddingVertical:18},
  label:{fontSize:15,fontWeight:'500',color:'#111827'},
  sub:{fontSize:12,color:'#6B7280',marginTop:3,paddingLeft:26},
  div:{height:1,backgroundColor:'#F3F4F6'},
  btn:{width:34,height:34,borderRadius:17,borderWidth:1.5,borderColor:ORANGE,alignItems:'center',justifyContent:'center'},
  btnDis:{borderColor:'#D1D5DB'},
  btnTxt:{fontSize:18,color:ORANGE,lineHeight:22},
  count:{fontSize:16,fontWeight:'600',color:'#111827',minWidth:26,textAlign:'center'},
  footer:{padding:16,backgroundColor:'#FFF',borderTopWidth:1,borderTopColor:'#E5E7EB'},
  confirmBtn:{backgroundColor:ORANGE,paddingVertical:14,borderRadius:8,alignItems:'center'},
  confirmBtnTxt:{color:'#FFF',fontWeight:'700',fontSize:16},
});

// ─────────────────────────────────────────────────────────────
// MAP MODAL — Real OSM tile map + price markers
// ─────────────────────────────────────────────────────────────
// OSM tile zoom 13, center on Yogyakarta: tile (6607, 4273)
// Grid bounds: lng 110.3027–110.4346, lat -7.711–-7.842
const MAP_Z = 13;
const MAP_CX = 6607;
const MAP_CY = 4273;
const LNG_MIN = 110.3027;
const LNG_MAX = 110.4346;
const LAT_TOP  = -7.711;  // north (smaller negative = more north)
const LAT_BOT  = -7.842;  // south

const TILE_GRID = [
  [{x:MAP_CX-1,y:MAP_CY-1},{x:MAP_CX,y:MAP_CY-1},{x:MAP_CX+1,y:MAP_CY-1}],
  [{x:MAP_CX-1,y:MAP_CY  },{x:MAP_CX,y:MAP_CY  },{x:MAP_CX+1,y:MAP_CY  }],
  [{x:MAP_CX-1,y:MAP_CY+1},{x:MAP_CX,y:MAP_CY+1},{x:MAP_CX+1,y:MAP_CY+1}],
];

// Convert lat/lng to pixel percentage on the 3×3 tile grid
function lngToPct(lng: number) { return ((lng-LNG_MIN)/(LNG_MAX-LNG_MIN))*100; }
function latToPct(lat: number) { return ((lat-LAT_TOP)/(LAT_BOT-LAT_TOP))*100; }

const MAP_MARKERS = [
  { id:'4', name:'Grand Aston', area:'Malioboro', price:2100000, lat:-7.793, lng:110.366, isHighlight:true },
  { id:'1', name:'Garrya Bianti', area:'Sleman', price:1650000, lat:-7.770, lng:110.375, isHighlight:false },
  { id:'2', name:'Hyatt Regency', area:'Ngaglik', price:1250000, lat:-7.755, lng:110.388, isHighlight:false },
  { id:'3', name:'Pakuwon', area:'Prawirotaman', price:1180000, lat:-7.812, lng:110.380, isHighlight:false },
  { id:'5', name:'Hotel Tentrem', area:'Malioboro', price:458874, lat:-7.783, lng:110.393, isHighlight:false },
];

interface MapModalProps {
  visible:boolean; checkIn:Date; checkOut:Date; rooms:number; adults:number; onClose:()=>void;
}
function MapModal({ visible,checkIn,checkOut,rooms,adults,onClose }: MapModalProps) {
  const [selectedHotel,setSelectedHotel] = useState(MAP_MARKERS[0]);
  const nights = nightsBetween(checkIn,checkOut);
  const tileSize = Math.ceil(SCREEN_W/3);
  const mapH = tileSize * 3;

  const openGMaps = () => {
    Linking.openURL('https://www.google.com/maps/search/hotel+yogyakarta/@-7.797,110.365,14z');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex:1,backgroundColor:'#F0F4F8'}}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF"/>

        {/* Header */}
        <View style={mSt.header}>
          <TouchableOpacity onPress={onClose} style={{padding:4}}>
            <Ionicons name="arrow-back" size={22} color="#111827"/>
          </TouchableOpacity>
          <View style={{flex:1,marginLeft:10}}>
            <Text style={mSt.headerTitle}>Di sekitar saya ({MAP_MARKERS.length * 189} Properti)</Text>
            <Text style={mSt.headerSub}>
              {formatShort(checkIn)} – {formatShort(checkOut)} · {rooms} kamar, {adults} tamu
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#374151"/>
        </View>

        {/* ── MAP AREA (OSM Tiles) ── */}
        <View style={{height:mapH,overflow:'hidden',position:'relative'}}>
          {/* 3×3 OSM tile grid */}
          {TILE_GRID.map((row,ri)=>(
            <View key={ri} style={{flexDirection:'row'}}>
              {row.map((tile,ci)=>(
                <Image
                  key={ci}
                  source={{uri:`https://tile.openstreetmap.org/${MAP_Z}/${tile.x}/${tile.y}.png`}}
                  style={{width:tileSize,height:tileSize}}
                  resizeMode="cover"
                />
              ))}
            </View>
          ))}

          {/* Overlay — markers */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {MAP_MARKERS.map(h=>{
              const left = SCREEN_W * lngToPct(h.lng) / 100;
              const top  = mapH    * latToPct(h.lat) / 100;
              return (
                <TouchableOpacity
                  key={h.id}
                  onPress={()=>setSelectedHotel(h)}
                  style={[
                    mSt.markerWrap,
                    {left: left - 45, top: top - 18}, // center the badge
                  ]}
                >
                  <View style={h.isHighlight||selectedHotel.id===h.id ? mSt.markerOrange : mSt.markerGreen}>
                    <Text style={mSt.markerTxt}>Rp {h.price.toLocaleString('id-ID')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* User location blue dot (center of Jogja kota) */}
            <View style={[mSt.userDotWrap,{
              left: SCREEN_W * lngToPct(110.365)/100 - 10,
              top:  mapH    * latToPct(-7.797)/100  - 10,
            }]}>
              <View style={mSt.userDotOuter}/>
              <View style={mSt.userDotInner}/>
            </View>
          </View>

          {/* "Cari di area ini" button */}
          <TouchableOpacity style={mSt.searchAreaBtn} onPress={openGMaps}>
            <Ionicons name="refresh" size={14} color="#FFF"/>
            <Text style={mSt.searchAreaTxt}>Cari di area ini</Text>
          </TouchableOpacity>

          {/* GPS button */}
          <TouchableOpacity style={mSt.gpsBtn} onPress={openGMaps}>
            <Ionicons name="locate" size={18} color="#374151"/>
          </TouchableOpacity>

          {/* OSM Attribution */}
          <View style={mSt.attribution}>
            <Text style={mSt.attributionTxt}>© OpenStreetMap contributors</Text>
          </View>
        </View>

        {/* Hotel cards scroll */}
        <View style={{backgroundColor:'#F9FAFB',paddingVertical:10}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,gap:12}}>
            {MAP_MARKERS.map(h=>(
              <TouchableOpacity
                key={h.id}
                style={[mSt.hotelCard, selectedHotel.id===h.id&&mSt.hotelCardSelected]}
                onPress={()=>setSelectedHotel(h)}
              >
                <View style={mSt.hotelCardImgBox}>
                  <Ionicons name="bed-outline" size={28} color="#9CA3AF"/>
                </View>
                <View style={{flex:1}}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:2}}>
                    <Ionicons name="location-outline" size={10} color="#6B7280"/>
                    <Text style={{fontSize:9,color:'#6B7280'}}>{h.area}</Text>
                  </View>
                  <Text style={{fontSize:12,fontWeight:'700',color:'#111827'}} numberOfLines={1}>{h.name}</Text>
                  <Text style={{fontSize:10,color:'#6B7280',marginTop:1}}>2.1 km dari Lokasi Sekarang</Text>
                  <Text style={{fontSize:11,fontWeight:'700',color:ORANGE,marginTop:3}}>
                    Rp {h.price.toLocaleString('id-ID')}/malam
                  </Text>
                </View>
                <Ionicons name="shield-checkmark" size={18} color="#2563EB" style={{alignSelf:'center'}}/>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom bar */}
        <View style={mSt.bottomBar}>
          <TouchableOpacity style={mSt.bottomBtn}>
            <Ionicons name="options-outline" size={18} color="#374151"/>
            <Text style={mSt.bottomBtnTxt}>Filter</Text>
          </TouchableOpacity>
          <View style={{width:1,height:24,backgroundColor:'#E5E7EB'}}/>
          <TouchableOpacity style={mSt.bottomBtn}>
            <Ionicons name="list-outline" size={18} color="#374151"/>
            <Text style={mSt.bottomBtnTxt}>Daftar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const mSt = StyleSheet.create({
  header:{
    flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:12,
    backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:'#E5E7EB',
  },
  headerTitle:{fontSize:13,fontWeight:'700',color:'#111827'},
  headerSub:{fontSize:11,color:'#6B7280',marginTop:2},
  markerWrap:{position:'absolute',zIndex:10},
  markerGreen:{
    backgroundColor:'#16A34A',borderRadius:6,paddingHorizontal:8,paddingVertical:4,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:3,elevation:5,
  },
  markerOrange:{
    backgroundColor:ORANGE,borderRadius:6,paddingHorizontal:8,paddingVertical:4,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:3,elevation:5,
  },
  markerTxt:{color:'#FFF',fontSize:10,fontWeight:'700'},
  userDotWrap:{position:'absolute',width:20,height:20,alignItems:'center',justifyContent:'center'},
  userDotOuter:{
    position:'absolute',width:20,height:20,borderRadius:10,
    backgroundColor:'rgba(37,99,235,0.25)',
  },
  userDotInner:{
    width:10,height:10,borderRadius:5,backgroundColor:'#2563EB',
    borderWidth:2,borderColor:'#FFF',
  },
  searchAreaBtn:{
    position:'absolute',top:12,alignSelf:'center',
    left: SCREEN_W/2 - 75,
    flexDirection:'row',alignItems:'center',gap:6,
    backgroundColor:'#2563EB',borderRadius:20,paddingHorizontal:16,paddingVertical:8,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.2,shadowRadius:4,elevation:6,
  },
  searchAreaTxt:{color:'#FFF',fontSize:12,fontWeight:'600'},
  gpsBtn:{
    position:'absolute',right:12,top:12,width:38,height:38,borderRadius:8,
    backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',
    shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.15,shadowRadius:3,elevation:3,
  },
  attribution:{
    position:'absolute',bottom:4,left:6,
    backgroundColor:'rgba(255,255,255,0.8)',paddingHorizontal:4,paddingVertical:2,borderRadius:3,
  },
  attributionTxt:{fontSize:8,color:'#374151'},
  hotelCard:{
    width:260,flexDirection:'row',backgroundColor:'#FFF',borderRadius:12,padding:12,
    alignItems:'center',gap:10,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:5,elevation:3,
    borderWidth:1.5,borderColor:'transparent',
  },
  hotelCardSelected:{borderColor:ORANGE},
  hotelCardImgBox:{
    width:64,height:64,borderRadius:8,backgroundColor:'#F3F4F6',
    alignItems:'center',justifyContent:'center',flexShrink:0,
  },
  bottomBar:{
    flexDirection:'row',backgroundColor:'#FFF',borderTopWidth:1,borderTopColor:'#E5E7EB',
    paddingVertical:12,justifyContent:'space-evenly',alignItems:'center',
  },
  bottomBtn:{flexDirection:'row',alignItems:'center',gap:6},
  bottomBtnTxt:{fontSize:14,fontWeight:'600',color:'#374151'},
});

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function HotelBookingScreen() {
  const navigation = useNavigation<NavProp>();
  const today = new Date();

  const [destination,setDestination] = useState('Yogyakarta (DIY), Indonesia');
  const [checkIn,  setCheckIn]  = useState<Date>(today);
  const [checkOut, setCheckOut] = useState<Date>(addDays(today,1));
  const [rooms,    setRooms]    = useState(1);
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuest,    setShowGuest]    = useState(false);
  const [showMap,      setShowMap]      = useState(false);

  const [selectedArea,  setSelectedArea]  = useState('Semua Jogja');
  const [activeCoupon,  setActiveCoupon]  = useState('Pengguna Baru');

  const nights    = nightsBetween(checkIn, checkOut);
  const dateLabel = `${formatShort(checkIn)} – ${formatShort(checkOut)} (${nights} malam)`;
  const guestLabel= `${rooms} kamar, ${adults} dewasa, ${children} anak`;

  const filteredHotels = selectedArea==='Semua Jogja'
    ? HOTELS
    : HOTELS.filter(h=>h.area===selectedArea);

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

      {/* Modals */}
      <CalendarModal
        visible={showCalendar} checkIn={checkIn} checkOut={checkOut}
        onConfirm={(ci,co)=>{ setCheckIn(ci); setCheckOut(co); }}
        onClose={()=>setShowCalendar(false)}
      />
      <GuestModal
        visible={showGuest} rooms={rooms} adults={adults} children={children}
        onConfirm={(r,a,c)=>{ setRooms(r); setAdults(a); setChildren(c); }}
        onClose={()=>setShowGuest(false)}
      />
      <MapModal
        visible={showMap} checkIn={checkIn} checkOut={checkOut}
        rooms={rooms} adults={adults} onClose={()=>setShowMap(false)}
      />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={{padding:4}}>
          <Ionicons name="arrow-back" size={22} color="#111827"/>
        </TouchableOpacity>
        <Text style={st.headerTitle}>Hotel & Akomodasi Jogja</Text>
        <TouchableOpacity style={{padding:4}}>
          <Ionicons name="ellipsis-vertical" size={20} color="#111827"/>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:32}}>
        {/* Form Card */}
        <View style={st.formCard}>
          <Text style={st.formLabel}>Tujuan / Area</Text>
          <View style={st.formRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" style={{marginRight:8}}/>
            <TextInput style={st.formInput} value={destination} onChangeText={setDestination}
              placeholder="Kota, hotel, atau destinasi"/>
            <Ionicons name="lock-closed-outline" size={14} color="#9CA3AF"/>
          </View>
          <View style={st.divider}/>

          <View style={st.formDoubleRow}>
            {/* Tanggal Menginap */}
            <TouchableOpacity style={st.formHalf} onPress={()=>setShowCalendar(true)} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280"/>
              <View style={{marginLeft:6,flex:1}}>
                <Text style={st.formHalfLabel}>Tanggal Menginap</Text>
                <Text style={st.formHalfValue} numberOfLines={2}>{dateLabel}</Text>
              </View>
            </TouchableOpacity>
            <View style={st.vertDiv}/>
            {/* Tamu & Kamar */}
            <TouchableOpacity style={st.formHalf} onPress={()=>setShowGuest(true)} activeOpacity={0.7}>
              <Ionicons name="people-outline" size={14} color="#6B7280"/>
              <View style={{marginLeft:6,flex:1}}>
                <Text style={st.formHalfLabel}>Tamu & Kamar</Text>
                <Text style={st.formHalfValue} numberOfLines={2}>{guestLabel}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={st.divider}/>

          <View style={st.formActions}>
            {/* PETA — buka MapModal */}
            <TouchableOpacity style={st.mapBtn} onPress={()=>setShowMap(true)}>
              <Ionicons name="map-outline" size={16} color={ORANGE}/>
              <Text style={st.mapBtnTxt}>Peta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.searchBtn}>
              <Text style={st.searchBtnTxt}>Cari</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Best Price Banner */}
        <View style={st.promoBanner}>
          <Ionicons name="thumbs-up" size={22} color="#FFF"/>
          <Text style={st.promoBannerTxt}>
            Ketemu harga lebih hemat? Klaim selisihnya dengan Best Price Guarantee.
          </Text>
        </View>

        {/* Kupon */}
        <View style={st.couponSection}>
          <Text style={st.sectionTitle}>Pakai Kupon Lebih Hemat</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:10}}>
            {COUPON_TAGS.map(tag=>(
              <TouchableOpacity key={tag} onPress={()=>setActiveCoupon(tag)}
                style={[st.couponTag, activeCoupon===tag&&st.couponTagActive]}>
                <Text style={[st.couponTagTxt, activeCoupon===tag&&st.couponTagTxtActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={st.couponCard}>
            <Text style={st.couponBread}>Hotel / Xperience / Rental Mobil...</Text>
            <View style={{flexDirection:'row',alignItems:'flex-start'}}>
              <View style={st.couponIcon}>
                <Ionicons name="pricetag" size={18} color="#2563EB"/>
              </View>
              <View style={{flex:1,marginLeft:10}}>
                <Text style={st.couponName}>Diskon s.d. Rp 300rb</Text>
                <Text style={st.couponDesc}>Hanya berlaku untuk Pengguna Baru</Text>
                <Text style={st.couponStock}>Stok terbatas</Text>
                <View style={st.stockBar}><View style={[st.stockFill,{width:'60%'}]}/></View>
              </View>
              <TouchableOpacity style={st.claimBtn}>
                <Text style={st.claimBtnTxt}>Klaim</Text>
              </TouchableOpacity>
            </View>
            <View style={{position:'absolute',top:10,right:10}}>
              <Ionicons name="information-circle-outline" size={16} color="#9CA3AF"/>
            </View>
          </View>
        </View>

        {/* Promo Hotel */}
        <View style={st.promoSection}>
          <Text style={st.sectionTitle}>Promo Hotel Jogja Untukmu</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:10}}>
            {AREA_FILTERS.map(area=>(
              <TouchableOpacity key={area} onPress={()=>setSelectedArea(area)}
                style={[st.areaTag, selectedArea===area&&st.areaTagActive]}>
                <Text style={[st.areaTagTxt, selectedArea===area&&st.areaTagTxtActive]}>{area}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:12}}>
            {filteredHotels.map(hotel=>(
              <TouchableOpacity key={hotel.id} style={st.hotelCard}>
                <View style={{position:'relative'}}>
                  <Image source={{uri:hotel.imageUrl}} style={st.hotelImage}/>
                  {hotel.discountPercent>0 && (
                    <View style={st.discBadge}>
                      <Text style={st.discBadgeTxt}>Hemat {hotel.discountPercent}%</Text>
                    </View>
                  )}
                  <TouchableOpacity style={st.bookmarkBtn}>
                    <Ionicons name="bookmark-outline" size={14} color="#6B7280"/>
                  </TouchableOpacity>
                </View>
                <View style={st.hotelInfo}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:2,marginBottom:2}}>
                    <Ionicons name="location-outline" size={10} color="#6B7280"/>
                    <Text style={{fontSize:9,color:'#6B7280'}}>{hotel.area}</Text>
                  </View>
                  <Text style={st.hotelName} numberOfLines={2}>{hotel.name}</Text>
                  <StarRating count={hotel.stars}/>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:4}}>
                    <View style={st.ratingBadge}>
                      <Text style={st.ratingScore}>{hotel.reviewScore}</Text>
                    </View>
                    <Text style={{fontSize:9,color:'#6B7280'}}>{hotel.reviewCount} ulasan</Text>
                  </View>
                  {hotel.discountPercent>0 && (
                    <Text style={st.origPrice}>Rp {hotel.originalPrice.toLocaleString('id-ID')}</Text>
                  )}
                  <Text style={st.discPrice}>Rp {hotel.discountPrice.toLocaleString('id-ID')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN STYLES
// ─────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F9FAFB'},
  header:{
    flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    paddingHorizontal:16,paddingVertical:14,backgroundColor:'#FFFFFF',
    borderBottomWidth:1,borderBottomColor:'#F3F4F6',
  },
  headerTitle:{fontSize:16,fontWeight:'700',color:'#111827'},
  formCard:{
    margin:16,backgroundColor:'#FFFFFF',borderRadius:12,paddingHorizontal:16,paddingVertical:12,
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:6,elevation:2,
  },
  formLabel:{fontSize:11,color:'#6B7280',fontWeight:'500',marginBottom:6},
  formRow:{flexDirection:'row',alignItems:'center'},
  formInput:{flex:1,fontSize:13,color:'#111827',paddingVertical:Platform.OS==='ios'?6:2},
  divider:{height:1,backgroundColor:'#F3F4F6',marginVertical:10},
  formDoubleRow:{flexDirection:'row',alignItems:'flex-start'},
  formHalf:{flex:1,flexDirection:'row',alignItems:'flex-start',paddingVertical:2},
  formHalfLabel:{fontSize:10,color:'#6B7280'},
  formHalfValue:{fontSize:11,color:'#111827',fontWeight:'500',marginTop:2},
  vertDiv:{width:1,height:44,backgroundColor:'#E5E7EB',marginHorizontal:10,marginTop:2},
  formActions:{flexDirection:'row',gap:10,marginTop:4},
  mapBtn:{
    flexDirection:'row',alignItems:'center',gap:6,
    borderWidth:1,borderColor:ORANGE,borderRadius:8,paddingHorizontal:16,paddingVertical:10,
  },
  mapBtnTxt:{color:ORANGE,fontWeight:'600',fontSize:14},
  searchBtn:{flex:1,backgroundColor:ORANGE,borderRadius:8,alignItems:'center',paddingVertical:10},
  searchBtnTxt:{color:'#FFF',fontWeight:'700',fontSize:14},
  promoBanner:{
    flexDirection:'row',alignItems:'center',gap:10,
    marginHorizontal:16,marginBottom:4,backgroundColor:ORANGE,borderRadius:10,padding:14,
  },
  promoBannerTxt:{flex:1,color:'#FFF',fontSize:12,lineHeight:17},
  couponSection:{paddingHorizontal:16,paddingTop:20},
  sectionTitle:{fontSize:15,fontWeight:'700',color:'#111827'},
  couponTag:{
    marginRight:8,borderRadius:20,borderWidth:1.5,borderColor:'#D1D5DB',
    paddingHorizontal:14,paddingVertical:6,
  },
  couponTagActive:{borderColor:ORANGE,backgroundColor:'#FFF7F0'},
  couponTagTxt:{fontSize:12,color:'#6B7280',fontWeight:'500'},
  couponTagTxtActive:{color:ORANGE,fontWeight:'700'},
  couponCard:{
    marginTop:12,backgroundColor:'#FFFFFF',borderRadius:12,padding:14,
    shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.06,shadowRadius:4,elevation:2,
  },
  couponBread:{fontSize:10,color:'#9CA3AF',marginBottom:8},
  couponIcon:{
    width:40,height:40,borderRadius:8,backgroundColor:'#EFF6FF',
    alignItems:'center',justifyContent:'center',
  },
  couponName:{fontSize:13,fontWeight:'700',color:'#111827'},
  couponDesc:{fontSize:11,color:'#6B7280',marginTop:2},
  couponStock:{fontSize:10,color:'#EF4444',marginTop:4,fontWeight:'500'},
  stockBar:{height:4,backgroundColor:'#F3F4F6',borderRadius:4,marginTop:4,width:100},
  stockFill:{height:'100%',backgroundColor:'#22C55E',borderRadius:4},
  claimBtn:{
    borderWidth:1.5,borderColor:'#2563EB',borderRadius:6,
    paddingHorizontal:14,paddingVertical:6,alignSelf:'center',
  },
  claimBtnTxt:{color:'#2563EB',fontWeight:'700',fontSize:12},
  promoSection:{paddingHorizontal:16,paddingTop:20},
  areaTag:{
    marginRight:8,borderRadius:20,borderWidth:1.5,borderColor:'#D1D5DB',
    paddingHorizontal:14,paddingVertical:6,
  },
  areaTagActive:{backgroundColor:ORANGE,borderColor:ORANGE},
  areaTagTxt:{fontSize:12,color:'#6B7280',fontWeight:'500'},
  areaTagTxtActive:{color:'#FFFFFF',fontWeight:'700'},
  hotelCard:{
    width:160,marginRight:12,backgroundColor:'#FFFFFF',borderRadius:12,overflow:'hidden',
    shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.07,shadowRadius:5,elevation:2,
  },
  hotelImage:{width:'100%',height:110},
  discBadge:{
    position:'absolute',bottom:6,left:6,backgroundColor:ORANGE,
    borderRadius:4,paddingHorizontal:6,paddingVertical:2,
  },
  discBadgeTxt:{color:'#FFF',fontSize:9,fontWeight:'700'},
  bookmarkBtn:{
    position:'absolute',top:6,right:6,backgroundColor:'#FFF',
    borderRadius:20,width:26,height:26,alignItems:'center',justifyContent:'center',
  },
  hotelInfo:{padding:10},
  hotelName:{fontSize:12,fontWeight:'700',color:'#111827',marginBottom:3,lineHeight:16},
  ratingBadge:{backgroundColor:'#F97316',borderRadius:4,paddingHorizontal:5,paddingVertical:2},
  ratingScore:{color:'#FFF',fontSize:10,fontWeight:'700'},
  origPrice:{fontSize:10,color:'#9CA3AF',textDecorationLine:'line-through',marginTop:4},
  discPrice:{fontSize:13,fontWeight:'700',color:ORANGE,marginTop:2},
});