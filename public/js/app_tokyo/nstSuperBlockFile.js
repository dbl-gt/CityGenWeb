

function nsSeg(a,b){
       this.p=new nsPt(parseFloat(a.x), parseFloat(a.y), 0);
       this.q=new nsPt(parseFloat(b.x), parseFloat(b.y), 0);
       this.le=utilDi(this.p, this.q);
       this.mp=new nsPt((this.p.x+this.q.x)/2, (this.p.y+this.q.y)/2, 0);
       this.renderedObject;
       this.getObj=function(){
           var path= new THREE.Geometry();
           path.vertices.push(new THREE.Vector3(this.p.x, this.p.y, 0));
           path.vertices.push(new THREE.Vector3(this.q.x, this.q.y, 0));
           var material = getPathMaterialFromType({color:new THREE.Color("rgb(0,0,255)")});
           this.renderedObject = new THREE.Line(path, material);
           return this.renderedObject;
       }
       this.display=function(){
           console.log("\nsegment: ")
           console.log(this.p,this.q);
       }
}

function nsSite(type, area, cen, pts){
       this.type=type;
       this.area=area;
       this.cen=cen;
       this.diag;   
       this.renderedObject;
       this.topLeSegArr=[];
       this.topRiSegArr=[];
       this.bottomLeSegArr=[];
       this.bottomRiSegArr=[];
       this.quadArr=[];

       this.pts=[];
       for(var i=0; i<pts.length; i++){
           var x=pts[i].x;
           var y=pts[i].y;
           var z=0;
           this.pts.push(new nsPt(x,y,z));
       }
       
       this.crvSegs=[];
       for(var i=0; i<this.pts.length-1; i++){
           var p=this.pts[i];
           var q=this.pts[i+1];
           var d=utilDi(p,q);
           if(d>0.01){
               this.crvSegs.push(new nsSeg(p,q));
           }
       }
   
       this.genGeo=function(){
           var geox=new THREE.Shape();
           
           var p=pts[0];
           geox.moveTo(0,0);
           for(var i=1; i<pts.length; i++){
               var q=pts[i];
               geox.lineTo(q.x-p.x,q.y-p.y);
           }
           geox.autoClose=true;
           var geometry=new THREE.ShapeGeometry(geox);
           var material=new THREE.MeshPhongMaterial({color:new THREE.Color("rgb(200,200,70)"), side:THREE.DoubleSide});
           var mesh=new THREE.Mesh(geometry, material);
           mesh.position.x=p.x;
           mesh.position.y=p.y;
           this.renderedObject=mesh;
           //siteArr.push(this.renderedObject);
           
           var geo2=new THREE.Geometry();
           for(var i=0; i<this.pts.length; i++){
               var p=this.pts[i];
               geo2.vertices.push(new THREE.Vector3(p.x,p.y,p.z));
           }
           var mat2=new THREE.LineBasicMaterial({color: new THREE.Color("rgb(0,0,0)")});
           var lineGeo=new THREE.Line(geo2, mat2);
           siteArr.push(lineGeo);
           //return mesh;
       }

       this.display=function(){
           var sp="";
           for(var i=0; i<this.pts.length; i++){
               console.log(this.pts[i]);
               var x=this.pts[i].x;
               var y=this.pts[i].y;
               var z=1;
               sp+=x+","+y+","+z+"\n";
           }
           var s="Site area: "+this.area+"\ncenter: "+this.cen+"\npoints: \n"+sp;
           console.log(s);
       }

       this.info=function(){
           var sp="";
           for(var i=0; i<this.pts.length; i++){
               var x=this.pts[i].x;
               var y=this.pts[i].y;
               var z=0;
               sp+=x+","+y+","+z+"\n";
           }
           var s="Site area: "+this.area+"\ncenter: "+this.cen+"\npoints: \n"+sp;
           return s;
       }

       this.getDiagonal=function(){
           var diagArr=new Array();
           for(var i=0; i<this.pts.length; i++){
               var p=this.pts[i];
               for(var j=0; j<this.pts.length; j++){
                   var q=this.pts[j];
                   var d=utilDi(p,q);
                   if(d>0){
                       diagArr.push([p,q,d]);
                   }
               }
           }
           diagArr.sort(function(a,b){
               return a[2]-b[2];
           });
           var dia=diagArr[diagArr.length-1];
           var p=dia[0];
           var q=dia[1];
           var d=dia[2];
           var s=new nsSeg(p,q);
           this.diag=s;
           return this.diag;
       }
   
    this.setBays=function(){
        this.topLeSegArr=[];// be careful of arrays in the class
        this.topRiSegArr=[];
        this.bottomLeSegArr=[];
        this.bottomRiSegArr=[];
        var p=this.diag.p;
        var q=this.diag.q;
        var r=this.diag.mp; 
        var norm=utilDi(p,q);
        var u=new nsPt((q.x-p.x)/norm, (q.y-p.y)/norm, 0);
        var nR=new nsPt(-u.y, u.x, 0);
        var nL=new nsPt(u.y, -u.x, 0);
        var baydepth=superBlockControls.bay_Depth;
        var intxDepth=100;
        var n=Math.floor(utilDi(p,r)/baydepth);

        // top bays
        for(var i=0; i<n; i++){
            var intoff=superBlockControls.int_off;
            var extoff=superBlockControls.ext_off;
            var s=i*baydepth;
            var a=new nsPt(r.x+u.x*s, r.y+u.y*s, 0);

            // right side of top            
            var b=new nsPt(a.x+nR.x*intxDepth, a.y+nR.y*intxDepth,0);
            var segR=this.getIntxSeg(a,b);
            if(segR!==0 && segR.le>baydepth/2){
                var I=segR.q;
                var aR=new nsPt(a.x+(I.x-a.x)*intoff/segR.le, a.y+(I.y-a.y)*intoff/segR.le, 0);
                var iR=new nsPt(I.x+(a.x-I.x)*extoff/segR.le, I.y+(a.y-I.y)*extoff/segR.le, 0);
                var check1=ptInSeg(a,aR,I);
                var check2=ptInSeg(aR,iR,I);
                if(check1===true && check2===true && utilDi(aR,iR)>baydepth/2){
                    var reqseg=new nsSeg(aR,iR);
                    var seg=reqseg.getObj();
                    this.topRiSegArr.push(reqseg);
                    siteSegArr.push(seg);
                }                
            }

            // left side of top           
            var c=new nsPt(a.x+nL.x*intxDepth, a.y+nL.y*intxDepth,0);
            var segL=this.getIntxSeg(a,c);
            if(segL!==0){
                var I=segL.q;
                var aL=new nsPt(a.x+(I.x-a.x)*intoff/segL.le, a.y+(I.y-a.y)*intoff/segL.le, 0);
                var iL=new nsPt(I.x+(a.x-I.x)*extoff/segL.le, I.y+(a.y-I.y)*extoff/segL.le, 0);
                var check1=ptInSeg(a,aL,I);
                var check2=ptInSeg(aL,iL,I);
                if(check1===true && check2===true && utilDi(aL,iL)>baydepth/2){
                    var reqseg=new nsSeg(aL,iL);
                    var seg=reqseg.getObj();
                    this.topLeSegArr.push(reqseg);
                    siteSegArr.push(seg);
                }                
            }                
        }
            
        // bottom bays
        for(var i=0; i<n; i++){
            var intoff=superBlockControls.int_off;
            var extoff=superBlockControls.ext_off;
            var s=i*baydepth;
            var a=new nsPt(r.x-u.x*s, r.y-u.y*s, 0);
            var b=new nsPt(a.x+nR.x*intxDepth, a.y+nR.y*intxDepth,0);
            //right            
            var segR=this.getIntxSeg(a,b);
            if(segR!==0){
                var I=segR.q;
                var aR=new nsPt(a.x+(I.x-a.x)*intoff/segR.le, a.y+(I.y-a.y)*intoff/segR.le, 0);
                var iR=new nsPt(I.x+(a.x-I.x)*extoff/segR.le, I.y+(a.y-I.y)*extoff/segR.le, 0);
                var check1=ptInSeg(a,aR,I);
                var check2=ptInSeg(aR,iR,I);
                if(check1===true && check2===true && utilDi(aR,iR)>baydepth/2){
                    var reqseg=new nsSeg(aR,iR);
                    var seg=reqseg.getObj();
                    this.bottomRiSegArr.push(reqseg);
                    siteSegArr.push(seg);
                }
                
            }
            //left
            var c=new nsPt(a.x+nL.x*intxDepth, a.y+nL.y*intxDepth,0);
            var segL=this.getIntxSeg(a,c);
            if(segL!==0){
                var I=segL.q;
                var aL=new nsPt(a.x+(I.x-a.x)*intoff/segL.le, a.y+(I.y-a.y)*intoff/segL.le, 0);
                var iL=new nsPt(I.x+(a.x-I.x)*extoff/segL.le, I.y+(a.y-I.y)*extoff/segL.le, 0);
                var check1=ptInSeg(a,aL,I);
                var check2=ptInSeg(aL,iL,I);
                if(check1==true && check2===true && utilDi(aL,iL)>baydepth/2){
                    var reqseg=new nsSeg(aL,iL);
                    var seg=reqseg.getObj();
                    this.bottomLeSegArr.push(reqseg);
                    siteSegArr.push(seg);
                }                
            }
        }
    }

       this.getIntxSeg=function(R,S){
              var I;
              var sum1=0;
              for(var j=0; j<this.crvSegs.length; j++){
                     var P=this.crvSegs[j].p;
                     var Q=this.crvSegs[j].q;
                     I=nsIntx(P,Q,R,S);
                     if(I.x!==0 && I.y!==0){
                            sum1++;
                            break;
                     }
              }
              if(sum1>0){
                     var s3=new nsSeg(R,I);
                     return s3;
              }else{
                     return 0;
              }
       }

       this.processBayArr=function(){
              this.processBays(this.topLeSegArr);  
              this.processBays(this.topRiSegArr);
              this.processBays(this.bottomLeSegArr); 
              this.processBays(this.bottomRiSegArr);
       }

       this.processBays=function(segs){
              for(var i=0; i<segs.length-1; i++){
                     var p=segs[i].p;
                     var q=segs[i].q;
                     var r=segs[i+1].q;
                     var s=segs[i+1].p;
                     var t=1;
                     //var quad=debugQuadZ(a0,b0,b1,a1,t);
                     var geox = new THREE.Geometry();
                     geox.vertices.push(new THREE.Vector3(p.x,p.y,t));
                     geox.vertices.push(new THREE.Vector3(q.x,q.y,t));
                     geox.vertices.push(new THREE.Vector3(r.x,r.y,t));
                     geox.vertices.push(new THREE.Vector3(s.x,s.y,t));
                     geox.vertices.push(new THREE.Vector3(p.x,p.y,t));
                     var matx=new THREE.LineBasicMaterial({color: new THREE.Color("rgb(255,0,0)")});
                     var Q = new THREE.Line(geox, matx);
                     siteQuadArr.push(Q);
              }
       }
}




