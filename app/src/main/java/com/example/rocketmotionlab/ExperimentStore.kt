package com.example.rocketmotionlab
import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class ExperimentStore(context: Context) {
    private val prefs=context.getSharedPreferences("rocket_motion_lab",Context.MODE_PRIVATE)
    fun save(s:ExperimentSummary){ val all=load().toMutableList(); all.removeAll{it.id==s.id}; all.add(0,s); val a=JSONArray(); all.forEach{a.put(it.toJson())}; prefs.edit().putString("experiments",a.toString()).apply() }
    fun load():List<ExperimentSummary>{ val a=JSONArray(prefs.getString("experiments","[]")?:"[]"); return buildList{for(i in 0 until a.length()) add(a.getJSONObject(i).toSummary())} }
    fun clear(){prefs.edit().remove("experiments").apply()}
}
private fun JSONObject.n(key:String)=if(!has(key)||isNull(key)) null else getDouble(key)
private fun ExperimentSummary.toJson():JSONObject{ val p=JSONArray(); points.forEach{q->p.put(JSONObject().put("t",q.t).put("x",q.xM).put("y",q.yM).put("vx",q.vx).put("vy",q.vy).put("v",q.speed).put("ax",q.ax).put("ay",q.ay).put("a",q.accel).put("f",q.force).put("ke",q.kineticEnergy).put("pe",q.potentialEnergy))}; return JSONObject().put("id",id).put("name",name).put("uri",videoUri).put("m",massGrams).put("scale",calibrationMetersPerPixel).put("h",maxHeightM).put("r",horizontalRangeM).put("vmax",maxSpeedMs).put("amax",maxAccelMs2).put("fmax",maxForceN).put("kemax",maxKineticEnergyJ).put("pemax",maxPotentialEnergyJ).put("tf",flightTimeS).put("stab",stabilityIndex).put("p",p)}
private fun JSONObject.toSummary():ExperimentSummary{ val pa=getJSONArray("p"); val pts=buildList{for(i in 0 until pa.length()){val q=pa.getJSONObject(i);add(PhysicsPoint(q.getDouble("t"),q.getDouble("x"),q.getDouble("y"),q.getDouble("vx"),q.getDouble("vy"),q.getDouble("v"),q.getDouble("ax"),q.getDouble("ay"),q.getDouble("a"),q.n("f"),q.n("ke"),q.n("pe")))}}; return ExperimentSummary(getLong("id"),getString("name"),getString("uri"),n("m"),getDouble("scale"),getDouble("h"),getDouble("r"),getDouble("vmax"),getDouble("amax"),n("fmax"),n("kemax"),n("pemax"),getDouble("tf"),getDouble("stab"),pts)}
