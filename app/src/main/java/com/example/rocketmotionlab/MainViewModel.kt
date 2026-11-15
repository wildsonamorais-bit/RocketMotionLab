package com.example.rocketmotionlab
import android.app.Application
import android.graphics.Bitmap
import android.net.Uri
import androidx.compose.ui.geometry.Offset
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class MainViewModel(app:Application):AndroidViewModel(app){
 var draft=AnalysisDraft(); private set
 var firstFrame:Bitmap?=null; private set
 var currentResult:ExperimentSummary?=null; private set
 var isProcessing=false; private set
 var error:String?=null; private set
 var experiments:List<ExperimentSummary> = emptyList(); private set
 private val analyzer=VideoAnalyzer(app); private val store=ExperimentStore(app)
 init{experiments=store.load()}
 fun setVideo(u:Uri){draft=draft.copy(videoUri=u,calibrationA=null,calibrationB=null,initialRocketPoint=null); firstFrame=null; viewModelScope.launch{firstFrame=analyzer.firstFrame(u)}}
 fun name(v:String){draft=draft.copy(experimentName=v)}; fun mass(v:String){draft=draft.copy(massGrams=v)}; fun distance(v:String){draft=draft.copy(realDistanceMeters=v)}
 fun calibration(p:Offset){draft=if(draft.calibrationA==null)draft.copy(calibrationA=p)else if(draft.calibrationB==null)draft.copy(calibrationB=p)else draft.copy(calibrationA=p,calibrationB=null,initialRocketPoint=null)}
 fun rocket(p:Offset){draft=draft.copy(initialRocketPoint=p)}
 fun reset(){draft=draft.copy(calibrationA=null,calibrationB=null,initialRocketPoint=null)}
 fun analyze(){val u=draft.videoUri?:return;val a=draft.calibrationA?:return;val b=draft.calibrationB?:return;val p=draft.initialRocketPoint?:return;val d=draft.realDistanceMeters.replace(',','.').toDoubleOrNull();if(d==null||d<=0){error="Distância inválida";return};val m=draft.massGrams.replace(',','.').toDoubleOrNull()?.takeIf{it>0};isProcessing=true;error=null;viewModelScope.launch{try{val r=analyzer.analyze(u,a,b,d,p,m).copy(name=draft.experimentName.ifBlank{"Experimento ${experiments.size+1}"});currentResult=r;store.save(r);experiments=store.load()}catch(e:Exception){error=e.message}finally{isProcessing=false}}}
 fun clear(){store.clear();experiments=emptyList()}
}
