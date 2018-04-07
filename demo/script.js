onload = function(){

	var c = document.getElementById('canvas');
	c.width = 500;
	c.height = 300;

	// WebGL コンテキスト描画などに関する様々な処理を一括して引き受けるオブジェクト
	var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	// 2016 年現在では、Google Chrome や Firefox などの多くの端末で、experimental の記述は不要となっています。
	// ただし、一部のモバイルブラウザや、かろうじて WebGL の実行が可能な IE11 等の場合、依然として上記のような対応が必要となるようです。

    // canvasを黒でクリア(初期化)する
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

}




