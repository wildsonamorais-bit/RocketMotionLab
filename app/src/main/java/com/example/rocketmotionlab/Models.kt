package com.example.rocketmotionlab
import android.net.Uri
import androidx.compose.ui.geometry.Offset

data class PhysicsPoint(val t:Double,val xM:Double,val yM:Double,val vx:Double,val vy:Double,val speed:Double,val ax:Double,val ay:Double,val accel:Double,val force:Double?,val kineticEnergy:Double?,val potentialEnergy:Double?)
data class ExperimentSummary(val id:Long=System.currentTimeMillis(),val name:String,val videoUri:String,val massGrams:Double?,val calibrationMetersPerPixel:Double,val maxHeightM:Double,val horizontalRangeM:Double,val maxSpeedMs:Double,val maxAccelMs2:Double,val maxForceN:Double?,val maxKineticEnergyJ:Double?,val maxPotentialEnergyJ:Double?,val flightTimeS:Double,val stabilityIndex:Double,val points:List<PhysicsPoint>)
data class AnalysisDraft(val videoUri:Uri?=null,val experimentName:String="",val massGrams:String="",val realDistanceMeters:String="1.0",val calibrationA:Offset?=null,val calibrationB:Offset?=null,val initialRocketPoint:Offset?=null)
