/* eslint-disable no-unused-vars */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - canvas functionality

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - initial statements

var isSigning = false;
var x = 0;
var y = 0;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - event listeners

canvas.addEventListener("mousedown", (event) => {
    x = event.offsetX;
    y = event.offsetY;
    isSigning = true;
});

canvas.addEventListener("mousemove", (event) => {
    if (isSigning === true) {
        drawSignature(ctx, x, y, event.offsetX, event.offsetY);
        x = event.offsetX;
        y = event.offsetY;
    } else {
        return;
    }
});

canvas.addEventListener("mouseup", (event) => {
    ctx.closePath();
    isSigning = false;
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - drawSignature function

function drawSignature(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - on submit: get data from input fields

var submit = $("#submit");

submit.on("mouseup", () => {
    var signature = $("#signature");
    var inputSignatureURL = canvas.toDataURL();

    signature.val(inputSignatureURL);
});
