
(function($){

    var camera, scene, renderer,
        geometry, container;

    var cameraPause = false;
    var mouseXPc = 0, cameraYRot = 0;
    var mouseYPc = 0, cameraYAcc = 0;

    var sensitivity = 0.03;
    var deadZone = 0.1;

    var packshots = [];
    var releases = [];
    var labels = [];
    var card, cardMaterial;

    var angle = 0;

    var apiURL = "api.php";
    var mainContainer, loading;

    var audioGraph;
    var bars = [];
    var barMaterials = [];

    var lightingEnabled = true;
    var spotLight;

    var releasesCleared;
    var releasesToClear;
    var playing;

    $(init);

    function init() {

        /*canvas2D = document.getElementById('canvas2D');
        renderer2D = new THREE.CanvasRenderer({canvas: canvas2D});*/

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        
        camera.position.z = 2000;
        scene.add( camera );

        container = new THREE.Object3D();
        scene.add(container);
        container.position.y = -200;

        $("#info").hide();
        $('#legend').hide();
        $("#audio-player").hide();

        createCard();
        createAudioGraph();
        loadCarousel();
        
        try {
        renderer = new THREE.WebGLRenderer({antialias:true});
        } catch(e){
            alert("Couldn't start the renderer, :( Try Google Chrome!");
        }
        //renderer = new THREE.CanvasRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );

        if(lightingEnabled){
            renderer.shadowMapEnabled = true;
            createLights();
        }

        mainContainer = $("#main");
        mainContainer.append( renderer.domElement );
        loading = $("#loading");
        
        THREE.Object3D._threexDomEvent.camera(camera);

        animate();

        $("#refresh").hide();
        
    }

    function refreshPlaylist(){

        $("#refresh a").off("click", refreshPlaylist);
        
        new TWEEN.Tween({rotation:0})
                        .to({rotation:360}, 2000)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(
                            function(){
                                var css = "rotate(-" + this.rotation + "deg)";
                                $("#refresh a").css({"-webkit-transform": css})
                            })
                        .start();
        clearCarousel();
        return false;
    }

    function loadCarousel(params){
        $(loading).fadeIn(200);
        var url;

        if(typeof params == "undefined"){
            url = apiURL + "?action=list_all"; 
        } else {
            url = apiURL + "?search&params=" + encodeURIComponent(params);
        }

        $.ajax(url,{success:function(data,status,jqxhr){ createCarousel(data) },
                    error:function(jqxhr, status, e){console.log(e, status, jqxhr)}
                    }
                );
    }

    function createCard(){
        var cardGeometry = new THREE.PlaneGeometry(400, 400);
        cardMaterial = new THREE.MeshBasicMaterial({color: 0x000000, transparent:true});
        card = new THREE.Mesh(cardGeometry, cardMaterial);
        cardMaterial.opacity = 0;
        scene.add(card);
        card.rotation.x = (Math.PI/2);
        card.position.x = 0;
        card.position.z = 900;

    }

    function createAudioGraph(){
        audioGraph = new THREE.Object3D();
        
        audioGraph.position = new THREE.Vector3(0, 0, 800);
        var barGeometry = new THREE.CubeGeometry(50, 400, 50);
        var danceabilityMaterial = new THREE.MeshLambertMaterial({color: 0xffcc00, transparent:true});
        var energyMaterial = new THREE.MeshLambertMaterial({color: 0xff0000, transparent:true});
        var speechinessMaterial = new THREE.MeshLambertMaterial({color: 0x0000ff, transparent:true});
        var tempoMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00, transparent:true});

        var danceBar = new THREE.Mesh(barGeometry, danceabilityMaterial);
        var energyBar = new THREE.Mesh(barGeometry, energyMaterial);
        var speechBar = new THREE.Mesh(barGeometry, speechinessMaterial);
        var tempoBar = new THREE.Mesh(barGeometry, tempoMaterial);

        danceBar.id = "dance";
        energyBar.id = "energy";
        speechBar.id = "speech";
        tempoBar.id = "tempo";

        bars = [danceBar, energyBar, speechBar, tempoBar];
        barMaterials = [danceabilityMaterial, energyMaterial, speechinessMaterial, tempoMaterial];

        danceBar.position = new THREE.Vector3(-500, 0, 0);
        energyBar.position = new THREE.Vector3(-300, 0, 0);
        speechBar.position = new THREE.Vector3(300, 0, 0);
        tempoBar.position = new THREE.Vector3(500, 0, 0);

        for(var i = 0; i < bars.length; i++){
            var bar = bars[i];
            var material = barMaterials[i];
            bar.scale = new THREE.Vector3(1,0.01,1);
            material.opacity = 0;
            audioGraph.add(bar);
        }

        scene.add(audioGraph);

    }

    function showTopBar(){
        $("#info").slideDown(400);
        $("#legend").fadeIn(400);
        $("#meta-loader").fadeIn(100);
    }

    function hideTopBar(){
        $("#info").slideUp(200);
        $("#legend").fadeOut(200);
        $("#audio-player").fadeOut(1000);
    }

    function createLights(){
        
        spotLight = new THREE.PointLight( 0xffffff, 2.5, 3500 );
        spotLight.position.set( 300, 400, 2000 );
        scene.add( spotLight );
    }

    function createCarousel(items){

        var num = items.length;
        if(num == 0){
            alert("Hmmm, no results. Better check your configuration.");
        }

        geometry = new THREE.CubeGeometry( 100, 100, 10 );
        var planeGeometry = new THREE.PlaneGeometry(100,100);
        
        var localCenter = new THREE.Vector3(0,0,0);
      
        var radius = 1000;
        var step = (Math.PI*2) / num;

        for(var i = 0; i < num; i++){
            var item = items[i];
            var texture = THREE.ImageUtils.loadTexture(item["image"], {}, function() {
                texture.needsUpdate = true;
            });

            var release = new THREE.Object3D();
            release.id = i;
            release.name = "release "+ i;
            release.info = item;

        
            var material = new THREE.MeshLambertMaterial({map: texture, transparent:true});
            //material.opacity = 0.3
            var packshot = new THREE.Mesh( geometry, material );
            packshot.name = "packshot " + i;
            packshot.id = i;
            packshot.tween = null;

            if(lightingEnabled == true){
                release.castShadow = true;
                release.receiveShadow = true;
            }
                        
            release.add(packshot);

            var labelTexture = createLabelTexture(item["title"]);
            var labelMaterial = new THREE.MeshBasicMaterial({map:labelTexture, transparent:true});

            var label = new THREE.Mesh(planeGeometry, labelMaterial);
            label.name = "label " + i;
            label.id = i;
            label.rotation.y = Math.PI;
            label.rotation.x = -(Math.PI/2)
            
            label.translateY(-105);
            label.tween = [];
            
            release.add(label)

            var x1 = Math.sin(step*i) * radius;
            var y1 = 0;
            var z1 = Math.cos(step*i) * radius;

            release.translateX(x1);
            release.translateZ(z1);
            release.lookAt(localCenter);

            container.add( release );
            packshots.push(packshot);
            releases.push(release);
            labels.push(label)
        }

        enableCarouselForMouseEvents();

        $(loading).fadeOut(500)
        $("#refresh a").on("click", refreshPlaylist);
        $("#refresh").fadeIn(500);
        cameraPause = false;
        
    }

    function enableCarouselForMouseEvents(){
        
        for(var n = 0; n < packshots.length; n++){
            
            var packshot = packshots[n];
            
            packshot.on('mouseover', zoomPackshot).on("mouseout", unZoomPackshot);

            packshot.on("click", onMouseClick);
          
        }
    }

    function disableCarouselForMouseEvents(){
        
        for(var n = 0; n < packshots.length; n++){
            var packshot = packshots[n];
            
            packshot.off('mouseover', zoomPackshot)
            packshot.off("mouseout", unZoomPackshot);

            packshot.off("click", onMouseClick);
          
        }
        cameraPause = false;
    }

    function zoomPackshot(event){
                                       
        var object3d    = event.target;

        var id = object3d.id;
        var label = labels[id];
        cameraPause = true;
        
        clearTweens(object3d);

        object3d.tween = new TWEEN.Tween(object3d.scale).to({x: 2, y: 2, z: 2}, 500).easing(TWEEN.Easing.Bounce.Out).start();

            
        clearTweens(label);
        
        label.tween.push(new TWEEN.Tween(label.scale).to({x: 2, y: 2, z: 2}, 200).easing(TWEEN.Easing.Quartic.Out).start());
        label.tween.push(new TWEEN.Tween(label.position).to({x:0, y:-200, z:-20},500).easing(TWEEN.Easing.Bounce.Out).start());

    }

    function unZoomPackshot(event){
        cameraPause = false;
        var object3d = event.target;

        clearTweens(object3d);
        object3d.tween = new TWEEN.Tween(object3d.scale).to({x:1.0, y:1.0, z:1.0}, 200).easing(TWEEN.Easing.Quartic.Out).start();
        var id = object3d.id;
        var label = labels[id];
        clearTweens(label);
        
        label.tween.push(new TWEEN.Tween(label.scale).to({x: 1.0, y: 1.0, z: 1.0}, 200).easing(TWEEN.Easing.Quartic.Out).start());
        label.tween.push(new TWEEN.Tween(label.position).to({x:0, y:-105, z:0},200).easing(TWEEN.Easing.Quartic.Out).start());
    }

    function createLabelTexture(text){
        var canvas2D = document.createElement("canvas");
        canvas2D.width = 256;
        canvas2D.height = 256;
        var context = canvas2D.getContext("2d");
        var backgroundMargin = 0;


        context.font = 18 + "pt Arial";
        context.textAlign = "left";
        context.textBaseline = "top";

        var textWidth = context.measureText(text).width;
        
        if(textWidth > canvas2D.width){
            text = text.substr(0,20) + "...";
        }
        
        context.fillStyle = "#ffffff";
        context.fillText(text, 0,0);

        var labelTexture = new THREE.Texture(canvas2D);
        labelTexture.needsUpdate = true;
        return labelTexture;
    }

    function clearCarousel(){
        disableCarouselForMouseEvents();
        releasesCleared = 0;
        releasesToClear = releases.length;
                
        for(var i = 0; i < releasesToClear; i++){
            (function(i){ 
                var release = releases[i];
                var delay = Math.random()*1000;
                var rotationTarget = (Math.random()*12) - 6;
                
                release.tween = [];
                release.tween.push(new TWEEN.Tween(release.position).to({y:-1000}, 1000)
                            .delay(delay)
                            .easing(TWEEN.Easing.Quadratic.In).onComplete( 
                                function(){
                                    //console.log("Complete", release.id)
                                    container.remove(release);
                                    
                                    releasesCleared++;
                                    checkClearance()}
                                )
                            .start());
                release.tween.push(new TWEEN.Tween(release.rotation)
                            .delay(delay)
                            .to({z:rotationTarget}, 900)
                            .easing(TWEEN.Easing.Quadratic.In)
                            .start());

            }(i));   
        }
    }

    function checkClearance(){
        
        if(releasesCleared == releasesToClear){
            releases = [];
            packshots = [];
            labels = [];
            //$("#refresh a").on("click", refreshPlaylist);
            $("#refresh").fadeOut(200);
            loadCarousel();
        } else {
            
        }
    }

    function onMouseMove(e){
        
        mouseXPc = (e.clientX / window.outerWidth) - 0.5;
        cameraYRot = (mouseXPc * sensitivity);
        mouseYPc = (e.clientY / window.outerHeight) - 0.5;
        cameraYAcc = (mouseYPc * 8);
        
    }

    function clearTweens(obj){
        if(typeof obj.tween == "undefined" || !obj.tween){
            return;
        }

        if( Object.prototype.toString.call( obj.tween ) === '[object Array]' ){
            for(var x = 0; x < obj.tween.length; x++){
                obj.tween[x].stop();
                TWEEN.remove(obj.tween[x]);
            }
            obj.tween = [];
        } else {
            
            obj.tween.stop();
            TWEEN.remove(obj.tween[x]);
        }
    }

    function onMouseClick(e){

        $("#refresh").fadeOut(200);

        var packshot = e.target;
        var label = labels[packshot.id];
        clearTweens(label);
        clearTweens(packshot)

        disableCarouselForMouseEvents();

        var release = e.target.parent;
        release.localPosition = release.position;

        var worldPosition = release.matrixWorld.multiplyVector3( new THREE.Vector3(0,0,0) );
        release.position = worldPosition;
        release.position.z -= 100;
        release.rotation = new THREE.Vector3(0,0,0);
        
        scene.add(release);
        
        release.tween = [];
        loadMeta(release);
        release.tween.push(new TWEEN.Tween(release.position).to({x:0, y:0, z:1100}, 2000).easing(TWEEN.Easing.Elastic.Out).start());
        release.rotation.y = Math.PI;
        release.tween.push(new TWEEN.Tween(release.scale).to({x:1.1, y:1.1, z:1.1}, 1000).easing(TWEEN.Easing.Quadratic.Out).start());
        label.tween.push( new TWEEN.Tween(label.position).to({x:0, y: 30, z: 10}, 1000).easing(TWEEN.Easing.Quadratic.Out).start())
        //label.tween.push( new TWEEN.Tween(label.scale).to({x:2, y:2, z:2}).easing(TWEEN.Easing.Quadratic.Out).start() );
        new TWEEN.Tween(cardMaterial).to({opacity:0.75}, 1000).start();
        
        packshot.on("click", dismissRelease);

    }

    function loadMeta(release){
        $("#info h2").html(release.info["title"]);
        
        showTopBar();
        var trackUrl = apiURL + "?action=track_profile&id=" + release.info["tracks"][0]["id"];

        $.ajax( trackUrl, {success: function(data,status,jqxhr){                                              
                                                       showMeta(data);                                                    
                                                    },
                            error:function(jqxhr, status, e){console.log(e)}
        });

        

    }

    function showMeta(data){
        // now we have a track id in the emi_artists namespace we can access the asset
        var accessUrl = apiURL + "?action=access&id=" + data.track["id"];

        $.ajax( accessUrl, {success: function(data,status,jqxhr){                                              
                                                       onAccessData(data);                                                    
                                                    },
                            error:function(jqxhr, status, e){console.log(e)}
        });

        var audioSummary = data.track.audio_summary;

        for(var i = 0; i < bars.length; i++){
            var bar = bars[i];
            var barMaterial = barMaterials[i];
            clearTweens(bar);
            clearTweens(barMaterial);
            var value = 0;
            switch(bar.id){
                case "dance":
                    value = parseFloat(audioSummary.danceability);
                break;
                case "energy":
                    value = parseFloat(audioSummary.energy);
                break;
                case "speech":
                    value = parseFloat(audioSummary.speechiness);
                break;
                case "tempo":
                    value = parseFloat(audioSummary.tempo) / 200;
                break;
            }
            barMaterial.opacity = 1;
            bar.tween = new TWEEN.Tween(bar.scale).to({y: value}, 2000).easing(TWEEN.Easing.Elastic.Out).start();
        }
        
        //
    }


    function onAccessData(data){
        $("#audio-player audio").attr("src",data.assets[0].url);
        $("#audio-player").fadeIn(1000);
        $("#meta-loader").hide();
    }

    function toScreenXY(position, camera) {
      var pos = position.clone();
      var canvas = renderer.domElement;
      var projScreenMat = new THREE.Matrix4();
      projScreenMat.multiply(camera.projectionMatrix, camera.matrixWorldInverse);
      projScreenMat.multiplyVector3( pos );

      return { x: ( pos.x + 1 ) * canvas.width / 2 + canvas.offsetLeft,
          y: ( - pos.y + 1) * canvas.height / 2 + canvas.offsetTop };
    }

    function dismissRelease(event){

        $("#refresh").fadeIn(500);

        var audioplayer = $("audio")[0];
        audioplayer.pause();

        var packshot = event.target;
        packshot.off("click", dismissRelease)
        var release = packshot.parent;
        var label = labels[release.id];
        var index = release.id;
                
        var step = (Math.PI*2) / releases.length
        var radius = 1000;
        var x1 = (Math.sin( (step*index) + container.rotation.y)) * radius;
        var y1 = 0;
        var z1 = (Math.cos( (step*index) + container.rotation.y)) * radius;

        var localPosition = new THREE.Vector3(0,0,0);
        scene.remove(release);
        container.add(release);
        release.position = release.localPosition;
        release.lookAt(new THREE.Vector3(0,0,0));
        release.scale = new THREE.Vector3(1,1,1);

        new TWEEN.Tween(cardMaterial).to({opacity:0}, 200).start();
        hideTopBar();

        for(var i = 0; i < bars.length; i++){
            var bar = bars[i];
            var barMaterial = barMaterials[i];
            clearTweens(bar);
            clearTweens(barMaterial);
            bar.tween = new TWEEN.Tween(bar.scale).to({y: 0.01}, 2000).easing(TWEEN.Easing.Elastic.Out).start();
            barMaterial.tween = new TWEEN.Tween(barMaterial).to({opacity:0}, 2000).easing(TWEEN.Easing.Quartic.Out).start();
        }

        enableCarouselForMouseEvents();
    

    }

    function animate() {

        // note: three.js includes requestAnimationFrame shim

        requestAnimationFrame( animate );
        TWEEN.update();
        render();

    }

    function render() {
            
        /*if(Math.abs(mouseXPc) > deadZone){
            container.rotation.y += cameraYRot;
        }*/
        if(!cameraPause){
            container.rotation.y += 0.001;
            
            angle += 0.01;
            for(var i = 0; i < releases.length-1; i+=2){
            releases[i].position.y += ( Math.sin(angle)*0.10);
            releases[i+1].position.y -= ( Math.sin(angle)*0.10);

            }
        }

        
        
        renderer.render( scene, camera );

    }


}(jQuery));