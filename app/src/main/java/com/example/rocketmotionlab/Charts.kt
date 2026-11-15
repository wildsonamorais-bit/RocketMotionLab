package com.example.rocketmotionlab
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.unit.dp
import kotlin.math.max

@Composable fun LineChart(title:String,x:List<Double>,y:List<Double>){Column{Text(title);Spacer(Modifier.height(6.dp));Canvas(Modifier.fillMaxWidth().height(210.dp)){if(x.size<2)return@Canvas;val xmin=x.minOrNull()?:0.0;val xmax=x.maxOrNull()?:1.0;val ymin=y.minOrNull()?:0.0;val ymax=y.maxOrNull()?:1.0;val xs=max(1e-9,xmax-xmin);val ys=max(1e-9,ymax-ymin);val p=Path();x.indices.forEach{i->val xx=((x[i]-xmin)/xs*size.width).toFloat();val yy=(size.height-(y[i]-ymin)/ys*size.height).toFloat();if(i==0)p.moveTo(xx,yy)else p.lineTo(xx,yy)};drawPath(p,androidx.compose.ui.graphics.Color.Black)}}}
