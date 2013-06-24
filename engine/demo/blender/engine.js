Engine = function(c){
    this.config = c ? c : {};
    if(!c.canvasId) throw "CanvasId should be specified!";
    this.canvas = document.getElementById(c.canvasId);
    this.initGL();
    this.initShaders();
    this.initControls();

    this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();
    this.angle = 45;
    this.angleX = 0;
    this.angleY = -66;

    this.gl.clearColor(0.2, 0.2, 0.2, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
};
Engine.prototype.initGL = function(){
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for(var i = 0; i < names.length; i++){
        try {
            context = this.canvas.getContext(names[i]);
        } catch (e) { console.log(e); }
        if(context){
            break;
        }
    }
    if(context){
        context.viewportWidth = this.canvas.width;
        context.viewportHeigth = this.canvas.height;
        this.gl = this.config.debug ? WebGLDebugUtils.makeDebugContext(context) : context;
    } else {
        alert("Couldn't initialize WebGL!");
    }
};
Engine.prototype.initShaders = function(){
    var fragmentShader = this.getShader(this.gl, "shader-fs");
    var vertexShader = this.getShader(this.gl, "shader-vs");

    var gl = this.gl;
    this.shaderProgram = gl.createProgram();
    var sp = this.shaderProgram;

    gl.attachShader(sp, vertexShader);
    gl.attachShader(sp, fragmentShader);
    gl.linkProgram(sp);

    if(!gl.getProgramParameter(sp, gl.LINK_STATUS)){
        alert("Could not initialize shaders!");
    }

    gl.useProgram(sp);
    sp.vertexPositionAttribute = gl.getAttribLocation(sp, "aVertexPosition");
    gl.enableVertexAttribArray(sp.vertexPositionAttribute);
    sp.vertexColorAttribute = gl.getAttribLocation(sp, "aVertexColor");
    gl.enableVertexAttribArray(sp.vertexColorAttribute);

    sp.pMatrixUniform = gl.getUniformLocation(sp, "uPMatrix");
    sp.mvMatrixUniform = gl.getUniformLocation(sp, "uMVMatrix");
};
Engine.prototype.initControls = function(){
    var self = this;
    // wheel
    var wheel = function(e){
        var delta = 0;
        if (!e) e = window.event;   /* For IE. */
        if (e.wheelDelta) {
            delta = e.wheelDelta/120;
        } else if (e.detail) {      /** Mozilla case. */
            delta = -e.detail/3;
        }
        if (delta){     // zoom
            self.angle *= delta > 0 ? 0.8 : 1.25;
            self.drawScene();
        }
        if (e.preventDefault) e.preventDefault();
        e.returnValue = false;
    };
    if (this.canvas.addEventListener)
        this.canvas.addEventListener('DOMMouseScroll', wheel, false);    /** DOMMouseScroll is for mozilla. */
    this.canvas.onmousewheel = wheel;

    // click
    var track = false;
    var pos = {};
    var mousedown = function(e){
        if(e.which == 2){
            pos.x = e.clientX;
            pos.y = e.clientY;
            track = true;
        }
    }
    var mouseup = function(e){
        if(e.which == 2){
            track = false;
        }
    }
    var mousemove = function(e){
        if(e.which == 2 && track){
            var d = {x:pos.x- e.clientX,y:pos.y- e.clientY};
            self.angleX -= d.x;
            self.angleY -= d.y;
            pos.x = e.clientX;
            pos.y = e.clientY;
            self.drawScene();
        }
    }
    if (this.canvas.addEventListener){
        this.canvas.addEventListener('mousedown', mousedown, false);
        this.canvas.addEventListener('mouseup', mouseup, false);
        this.canvas.addEventListener('mousemove', mousemove, false);
    }

};
function degToRad(degrees){
    return degrees * Math.PI / 180;
};
Engine.prototype.drawScene = function(scene){
    if(scene) this.scene = scene;
    else if(this.scene) scene = this.scene;
    var gl = this.gl;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeigth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.angle, gl.viewportWidth / gl.viewportHeigth, 0.1, 100.0, this.pMatrix);
    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, [0, 0.0, -15.0]);
    mat4.rotate(this.mvMatrix, degToRad(this.angleX), [0, 1, 0]);
    mat4.rotate(this.mvMatrix, degToRad(this.angleY), [1, 0, 0]);

    this.drawGrid();

    if(scene && scene.meshes){
        for(var i in scene.meshes){
            this.drawMesh(scene.meshes[i]);
        }
    }
};
Engine.prototype.drawGrid = function(){
    if(!this.grid){
        this.initGridBuffers();
    }
    this.drawMesh(this.grid);
};
Engine.prototype.drawMesh = function(mesh){
    var gl = this.gl;
    if(!mesh.initialized){
        this.initMeshBuffers(mesh);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexPositionBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute,
        mesh.vertexPositionBufferItemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexColorBuffer);
    gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute,
            mesh.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    this.mvPushMatrix();
    this.modifyMVMatrix(mesh);
    this.setMatrixUniforms();
    this.mvPopMatrix();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.vertexIndexBuffer);
    gl.drawElements(gl.LINES, mesh.vertexIndexBufferNumItems, gl.UNSIGNED_SHORT, 0);

    if(mesh.submesh){
        for(var i in mesh.submesh){
            var m = mesh.submesh[i];
            this.drawMesh(m);
        }
    }
};
Engine.prototype.modifyMVMatrix = function(mesh){
    var d;
    if(mesh.parent) {
        this.modifyMVMatrix(mesh.parent);
        d = vec3.create();
        vec3.subtract(mesh.loc, mesh.parent.loc, d);
    } else d = mesh.loc;
    mat4.translate(this.mvMatrix, d);
    if(mesh.rot){
        mat4.rotate(this.mvMatrix, mesh.rot[0], [1, 0, 0]);
        mat4.rotate(this.mvMatrix, mesh.rot[1], [0, 1, 0]);
        mat4.rotate(this.mvMatrix, mesh.rot[2], [0, 0, 1]);
    }
};
Engine.prototype.initMeshBuffers = function(mesh){
    var gl = this.gl;
    mesh.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);
    mesh.vertexPositionBufferItemSize = 3;
    mesh.vertexPositionBufferNumItems = mesh.vertices.length/3;

    mesh.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indexes), gl.STATIC_DRAW);
    mesh.vertexIndexBufferItemSize = 1;
    mesh.vertexIndexBufferNumItems = mesh.indexes.length;
    mesh.initialized = true;

    // color
    mesh.vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexColorBuffer);
    var colors = mesh.colors;
    if(!colors){
        var color = mesh.color ? mesh.color: [1.0,1.0,1.0,1.0];
        colors = [];
        for(var i = 0; i < mesh.vertexPositionBufferNumItems; i++){
            colors = colors.concat(color);
        }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    mesh.vertexColorBuffer.itemSize = 4;
    mesh.vertexColorBuffer.numItems = mesh.vertexPositionBufferNumItems;
};
Engine.prototype.initGridBuffers = function(){
    var v = [], i = [], c = [];
    var n = 8, N = 2*n+1, s = 5;
    for(var x = 0; x < N; x++){
        for(var y = 0; y < N; y++){
            v.push((x-n)*s, (y-n)*s, 0);
            if(x - n == 0) c.push(0.2, 0.6, 0.2, 1.0);
            else if(y - n == 0) c.push(0.7, 0.2, 0.2, 1.0);
            else c.push(0.5, 0.5, 0.5, 1.0);
        }
        i.push(x, N*(N-1)+x);
        i.push(x*N, (x+1)*N-1);
    }
    this.grid = {vertices:v, indexes:i, loc:[0,0,0], colors:c};
    this.initMeshBuffers(this.grid);
};
Engine.prototype.getShader = function(gl, id){
    var shaderScript = document.getElementById(id);
    if(!shaderScript) return null;

    var str = "";
    var k = shaderScript.firstChild;
    while(k){
        if(k.nodeType == 3) str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if(shaderScript.type == "x-shader/x-fragment"){
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if(shaderScript.type == "x-shader/x-vertex"){
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else return null;

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};
Engine.prototype.mvPushMatrix = function(){
    var copy = mat4.create();
    mat4.set(this.mvMatrix, copy);
    this.mvMatrixStack.push(copy);
};
Engine.prototype.mvPopMatrix = function() {
    if(this.mvMatrix.length == 0) throw "Invalid mvPopMatrix!";
    this.mvMatrix = this.mvMatrixStack.pop();
};
Engine.prototype.setMatrixUniforms = function(){
    this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
};