package com.example.rocketmotionlab
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.media.MediaMetadataRetriever
import android.net.Uri
import androidx.compose.ui.geometry.Offset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.*

class VideoAnalyzer(private val context:Context){
 suspend fun firstFrame(uri:Uri):Bitmap?=withContext(Dispatchers.IO){val r=MediaMetadataRetriever();try{r.setDataSource(context,uri);r.getFrameAtTime(0,MediaMetadataRetriever.OPTION_CLOSEST_SYNC)}finally{r.release()}}
 suspend fun analyze(uri:Uri,a:Offset,b:Offset,realM:Double,rocket:Offset,massG:Double?,fps:Double=20.0):ExperimentSummary=withContext(Dispatchers.Default){
  val px=hypot((b.x-a.x).toDouble(),(b.y-a.y).toDouble()).coerceAtLeast(1.0); val scale=realM/px
  val r=MediaMetadataRetriever(); r.setDataSource(context,uri); val dur=min((r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()?:0L)/1000.0,10.0); val dt=1.0/fps; val n=max(5,floor(dur*fps).toInt())
  val first=r.getFrameAtTime(0,MediaMetadataRetriever.OPTION_CLOSEST)?:error("Não foi possível ler o vídeo")
  var px0=rocket.x.roundToInt().coerceIn(0,first.width-1).toDouble(); var py0=rocket.y.roundToInt().coerceIn(0,first.height-1).toDouble(); val ref=first.getPixel(px0.toInt(),py0.toInt()); val raw=mutableListOf<Triple<Double,Double,Double>>()
  for(i in 0 until n){val t=i*dt; val f=r.getFrameAtTime((t*1e6).toLong(),MediaMetadataRetriever.OPTION_CLOSEST)?:continue; val q=track(f,px0,py0,ref); px0=q.first; py0=q.second; raw.add(Triple(t,px0,py0))}; r.release(); require(raw.size>=5){"Rastreamento insuficiente"}
  val x0=raw.first().second; val y0=raw.first().third; val x=smooth(raw.map{(it.second-x0)*scale}); val yr=raw.map{(y0-it.third)*scale}; val ymin=yr.minOrNull()?:0.0; val y=smooth(yr.map{it-ymin}); val t=raw.map{it.first}; val vx=smooth(der(t,x)); val vy=smooth(der(t,y)); val ax=smooth(der(t,vx)); val ay=smooth(der(t,vy)); val m=massG?.takeIf{it>0}?.div(1000.0); val g=9.80665
  val pts=t.indices.map{i->val v=hypot(vx[i],vy[i]); val ac=hypot(ax[i],ay[i]); PhysicsPoint(t[i],x[i],y[i],vx[i],vy[i],v,ax[i],ay[i],ac,m?.let{it*ac},m?.let{0.5*it*v*v},m?.let{it*g*y[i]})}
  val h=pts.maxOf{it.yM}; val range=pts.maxOf{it.xM}-pts.minOf{it.xM}; val mean=pts.map{it.xM}.average(); val sx=sqrt(pts.map{(it.xM-mean).pow(2)}.average()); val stab=if(h>1e-6)(100*(1-sx/h)).coerceIn(0.0,100.0) else 0.0
  ExperimentSummary(name="Experimento",videoUri=uri.toString(),massGrams=massG,calibrationMetersPerPixel=scale,maxHeightM=h,horizontalRangeM=range,maxSpeedMs=pts.maxOf{it.speed},maxAccelMs2=pts.maxOf{it.accel},maxForceN=pts.mapNotNull{it.force}.maxOrNull(),maxKineticEnergyJ=pts.mapNotNull{it.kineticEnergy}.maxOrNull(),maxPotentialEnergyJ=pts.mapNotNull{it.potentialEnergy}.maxOrNull(),flightTimeS=pts.last().t-pts.first().t,stabilityIndex=stab,points=pts)
 }
 private fun track(f:Bitmap,cx:Double,cy:Double,ref:Int,radius:Int=70,tol:Int=85):Pair<Double,Double>{val rr=Color.red(ref);val rg=Color.green(ref);val rb=Color.blue(ref);val l=(cx.toInt()-radius).coerceAtLeast(0);val rt=(cx.toInt()+radius).coerceAtMost(f.width-1);val tp=(cy.toInt()-radius).coerceAtLeast(0);val bt=(cy.toInt()+radius).coerceAtMost(f.height-1);var sw=0.0;var sx=0.0;var sy=0.0;var y=tp;while(y<=bt){var x=l;while(x<=rt){val c=f.getPixel(x,y);val d=sqrt(((Color.red(c)-rr).pow(2)+(Color.green(c)-rg).pow(2)+(Color.blue(c)-rb).pow(2)).toDouble());if(d<=tol){val w=1/(1+d);sw+=w;sx+=x*w;sy+=y*w};x+=2};y+=2};return if(sw>1e-3) sx/sw to sy/sw else cx to cy}
 private fun smooth(v:List<Double>,w:Int=5)=v.indices.map{i->val a=max(0,i-w/2);val b=min(v.lastIndex,i+w/2);v.subList(a,b+1).average()}
 private fun der(t:List<Double>,y:List<Double>)=y.indices.map{i->when(i){0->(y[1]-y[0])/(t[1]-t[0]);y.lastIndex->(y[i]-y[i-1])/(t[i]-t[i-1]);else->(y[i+1]-y[i-1])/(t[i+1]-t[i-1])}}
}
