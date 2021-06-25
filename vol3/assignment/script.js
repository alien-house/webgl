
// = 028 ======================================================================
// ベクトルによって進行方向を管理する方法の、さらなる発展系のサンプルです。
// このサンプルでは、人工衛星自身が「自分が進むべき方向」を持っています。つまり、
// 外部から「こっちに向かえ！」と指示されて動くのではなく、自分自身がどちらに進
// むべきなのかは人工衛星自身が管理しているというデータ構造です。
// このような実装を行うと、人工衛星がより有機的に動くようになります。単なる追尾
// の実装とどのあたりが違っているのか、注意深く観察してみるとよいでしょう。
/* 課題
最後に今回の課題ですが……せっかくサイン・コサインを覚えたので、それを活用したテーマとして……
太陽と、その周りを周回する地球、さらにその地球の周りを周回する月、を表現してみましょう。
もしそれらが余裕でできる！ ということなら、さらなる課題として「地球上に建築されたビルや塔」なんかも追加してみてもいいかもしれません。
サインやコサイン、Group 機能などを駆使して様々な表現にトライしてみよう
*/
// ============================================================================

(() => {
    window.addEventListener('DOMContentLoaded', () => {
        // キーダウンイベント
        window.addEventListener('keydown', (event) => {
            switch(event.key){
                case 'Escape':
                    run = event.key !== 'Escape';
                    break;
                default:
            }
        }, false);
        // リサイズイベント
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }, false);

        // マウスカーソルが動いたことを検出して処理を行う
        // window.addEventListener('mousemove', (event) => {
        //     // マウスカーソルの位置から月の座標を設定する
        //     let x = event.clientX / window.innerWidth;
        //     let y = event.clientY / window.innerHeight;
        //     x = x * 2.0 - 1.0;
        //     y = y * 2.0 - 1.0;
        //     const length = Math.sqrt(x * x + y * y);
        //     x /= length;
        //     y /= length;
        //     moon.position.set(x * MOON_RANGE, 0.0, y * MOON_RANGE);
        // }, false);

        // ２つの画像のロードとテクスチャの生成
        const loader = new THREE.TextureLoader();
        earthTexture = loader.load('./earth.jpg', () => {
            // 月の画像がテクスチャとして生成できたら init を呼ぶ
            moonTexture = loader.load('./moon.jpg', () => {
                sunTexture = loader.load('./sun.jpg',init);
            });
        });
    }, false);

    // 汎用変数
    let run = true; // レンダリングループフラグ
    let startTime = 0; // レンダリング開始時のタイムスタンプ 

    // three.js に関連するオブジェクト用の変数
    let scene;             // シーン
    let camera;            // カメラ
    let renderer;          // レンダラ
    let geometry;          // ジオメトリ
    let controls;          // カメラコントロール
    let axesHelper;        // 軸ヘルパーメッシュ
    let directionalLight;  // ディレクショナル・ライト（平行光源）
    let ambientLight;      // アンビエントライト（環境光）

    let earth;             // 地球のメッシュ
    let earthMaterial;     // 地球用マテリアル
    let earthTexture;      // 地球用テクスチャ

    let sun;             // 太陽のメッシュ
    let sunMaterial;     // 太陽用マテリアル
    let sunTexture;      // 太陽用テクスチャ
    let moon;              // 月のメッシュ
    let moonMaterial;      // 月用マテリアル
    let moonTexture;       // 月用テクスチャ
    let satellite;         // 人工衛星のメッシュ
    let satelliteMaterial; // 人工衛星用マテリアル
    let satelliteVector;   // 人工衛星の進行方向 @@@
    let moonGrp;   //  @@@

    // 月の移動量に対するスケール
    const MOON_RANGE = 2.75;
    // 人工衛星の移動スピード
    const SATELLITE_SPEED = 0.05;

    // カメラに関するパラメータ
    const CAMERA_PARAM = {
        fovy: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 30.0,
        x: 0.0,
        y: 5.0,
        z: 10.0,
        lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
    // レンダラに関するパラメータ
    const RENDERER_PARAM = {
        clearColor: 0xffffff,
        width: window.innerWidth,
        height: window.innerHeight,
    };
    // マテリアルのパラメータ
    const MATERIAL_PARAM = {
        color: 0xffffff,
    };
    // 人工衛星のマテリアルパラメータ
    const MATERIAL_PARAM_SATELLITE = {
        color: 0x00ffff,
    };
    // ライトに関するパラメータ
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };
    // アンビエントライトに関するパラメータ
    const AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.2,
    };

    function init(){
        // シーン
        scene = new THREE.Scene();

        // レンダラ
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(RENDERER_PARAM.width, RENDERER_PARAM.height);
        const wrapper = document.querySelector('#webgl');
        wrapper.appendChild(renderer.domElement);

        // カメラ
        camera = new THREE.PerspectiveCamera(
            CAMERA_PARAM.fovy,
            CAMERA_PARAM.aspect,
            CAMERA_PARAM.near,
            CAMERA_PARAM.far
        );
        camera.position.set(CAMERA_PARAM.x, CAMERA_PARAM.y, CAMERA_PARAM.z);
        camera.lookAt(CAMERA_PARAM.lookAt);

        // スフィアジオメトリの生成
        geometry = new THREE.SphereGeometry(1.0, 64, 64);

        // マテリアルを生成し、テクスチャを設定する
        earthMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        earthMaterial.map = earthTexture;
        sunMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        sunMaterial.map = sunTexture;
        moonMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        moonMaterial.map = moonTexture;
        earth = new THREE.Mesh(geometry, earthMaterial);
        moon = new THREE.Mesh(geometry, moonMaterial);
        sun = new THREE.Mesh(geometry, sunMaterial);
        scene.add(sun);
        
        moonGrp = new THREE.Group();
        moonGrp.add(earth);
        moonGrp.add(moon);
        scene.add(moonGrp);



        // 月は、サイズを小さくして、位置も動かしておく
        moon.scale.setScalar(0.1);
        // moon.position.set(MOON_RANGE, 0.0, 0.0);
        earth.scale.setScalar(0.20);

        // 人工衛星
        // satelliteMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM_SATELLITE);
        // satellite = new THREE.Mesh(geometry, satelliteMaterial);
        // scene.add(satellite);
        // satellite.scale.setScalar(0.2);
        // // 初期位置を地球の上のあたりに移動させておく
        // satellite.position.set(0.0, 1.2, 0.0);
        // // 人工衛星の進行方向の初期値を設定しておく（真上に向かう） @@@
        // satelliteVector = new THREE.Vector3(0.0, 1.0, 0.0);
        satelliteVector = new THREE.Vector3(0.0, 1.0, 0.0);

        // ディレクショナルライト
        directionalLight = new THREE.DirectionalLight(
            DIRECTIONAL_LIGHT_PARAM.color,
            DIRECTIONAL_LIGHT_PARAM.intensity
        );
        directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
        directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
        directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
        scene.add(directionalLight);

        // アンビエントライト
        ambientLight = new THREE.AmbientLight(
            AMBIENT_LIGHT_PARAM.color,
            AMBIENT_LIGHT_PARAM.intensity
        );
        scene.add(ambientLight);

        // 軸ヘルパー
        axesHelper = new THREE.AxesHelper(5.0);
        scene.add(axesHelper);

        // コントロール
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        // すべての初期化が完了したら描画を開始する
        run = true;
        // レンダリング開始の瞬間のタイムスタンプを変数に保持しておく
        startTime = Date.now();
        render();
    }

    function render(){
        // 再帰呼び出し
        if(run === true){requestAnimationFrame(render);}

        // earth.rotation.y += 0.02;
        sun.rotation.z += 0.002;
        sun.rotation.x += 0.002;
        sun.rotation.y += 0.002;
        earth.rotation.y += 0.02;
        moon.rotation.y += 0.02;


        // 月の座標は、時間の経過からサインとコサインを使って決める @@@
        const nowTime = (Date.now() - startTime) / 3000;
        const sin = Math.sin(nowTime);
        const cos = Math.cos(nowTime);
        // 求めたサインとコサインで月の座標を指定する @@@
        moonGrp.position.set(cos * MOON_RANGE, 0.0, sin * MOON_RANGE);
        
        const sinM = Math.sin(nowTime * 2);
        const cosM = Math.cos(nowTime * 2);
        moon.position.set(cosM * 0.6, 0.0, sinM * 0.6);
        // console.log(earth.position.x);
        // moon.position.set(cos * MOON_RANGE, earth.position.x, sin * MOON_RANGE);

        // 人工衛星と月の位置関係からベクトルを作り、単位化する（以前と同じ内容）
        // const vectorOfEarthToMoon = moon.position.clone().sub(earth.position);
        const vectorOfEarthX = earth.position.clone();
        vectorOfEarthX.normalize();
        vectorOfEarthX.multiplyScalar(0.1);
        // moon.position.add(vectorOfEarthX.clone().multiplyScalar(0.3));
        // var moonpos = vectorOfEarthX.clone().multiplyScalar(0.3);
        // moon.position.set(moonpos.x * 5, 0.0, moonpos.z * 5);
        // console.log(moonpos);
        // // // 相互の位置関係ベクトルと、人工衛星の進行方向とを合成する @@@
        // vectorOfEarthToMoon.multiplyScalar(0.001); // まずはちょっと小さくして……
        // satelliteVector.add(vectorOfEarthToMoon); // 次にこれを加算して……
        // satelliteVector.normalize(); // 最後に進行方向ベクトルは単位化する
        // moon.position.add(satelliteVector.clone().multiplyScalar(SATELLITE_SPEED));

        // レンダリング
        renderer.render(scene, camera);
    }
})();

