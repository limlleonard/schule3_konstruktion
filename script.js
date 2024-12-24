const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const board=document.getElementById("board");
canvas.width = board.offsetWidth;
canvas.height = board.offsetHeight;

const center=[canvas.width/2, canvas.height/2] // F1
const centerLeft=[center[0]-canvas.width/5,center[1]] //F2
const Rcircle=canvas.width/2*0.8; // der große Kreis
const Rpoint=5; // der Radius einer Punkte
let angle=Math.PI; // Winkel der bewegende Punkt auf dem großen Kreis
let points=[]; // Finale Punkte

let nrSchritt=-1 // am Anfang wird nichts in der Anweisung gezeigt
let nrSchrittAnweisung=-1
const pAnweisung = document.getElementById("anweisung");
// const btnStartPause = document.getElementById("startPause");
const btnRückwärts = document.getElementById("rückwärts");
const btnVorwärts = document.getElementById("vorwärts");
const anweisungenVorbereitung=[
    "Zwei Punkte F1 und F2 festlegen",
    "Ein Kreis um F1 ziehen (F2 muss im Kreis sein)"
];
const anweisungen=[
    "Einen beliebigen Punkt E auf dem Kreislinie festlegen",
    "Die Strecke EF1 ziehen",
    "Die Strecke EF2 ziehen",
    "Ein Kreis um E mit r=EF2 ziehen",
    "Ein Kreis um F2 mit r=EF2 ziehen",
    "Die 2 Kreisen schneiden sich auf 2 Punkte",
    "Eine Gerade durch die 2 Schnittpunkte ziehen (Mittelsenkrechte)",
    "schneidet die Strecke EF2 auf S",
    "Diese Vorfahren wiederholen"
];

function mlPoint(p1, color='white', r=Rpoint){ // draw point
    ctx.beginPath();
    ctx.arc(...p1, r, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
}
function mlCircle(p1, r, color='white'){
    ctx.beginPath();
    ctx.arc(...p1, r, 0, Math.PI*2);
    ctx.strokeStyle = color;
    ctx.stroke();
}
function mlLine(p1,p2){
    ctx.beginPath();
    ctx.moveTo(...p1);
    ctx.lineTo(...p2);
    ctx.stroke();
}
function mlText(p1,text) {
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.fillText(text, p1[0]+10, p1[1]+10);
}
// Input, center of two circles and the radius / distnace. Ouput: zwei schnittpunkte
function schnittCircle(p1, p2, distance) {
    const [x1, y1] = p1; // Center of the first circle
    const [x2, y2] = p2; // Center of the second circle
    const r1 = distance; // Radius of the first circle
    const r2 = distance; // Radius of the second circle

    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy); // Distance between the two centers

    // Check for no intersection
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
        return null; // No intersection points
    }

    // Calculate the distance from the first circle's center to the line joining the intersection points
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);

    // Coordinates of the point where the line through the circle intersection points crosses the line between the centers
    const x0 = x1 + (a * dx) / d;
    const y0 = y1 + (a * dy) / d;

    // Offset of the intersection points from (x0, y0)
    const rx = -(dy * h) / d;
    const ry = (dx * h) / d;

    // The two intersection points
    const intersection1 = [x0 + rx, y0 + ry];
    const intersection2 = [x0 - rx, y0 - ry];

    return [intersection1, intersection2];
}
// Input: zwei Punkte einer strecke. Output: zwei Schnittunkts von der Mittelsenkrecht Gerade und Grenze der Canvas
function mittelsenkrecht(p1, p2){
    const [x1,y1]=p1;
    const [x2,y2]=p2;
    if (Math.abs(x1-x2)<1e-5){
        return [[0, y1/2+y2/2], [canvas.width, y1/2+y2/2]]
    } else if (Math.abs(y1-y2)<1e-5) {
        return [[x1/2+x2/2, 0], [x1/2+x2/2, canvas.height]]
    } else {
        const xm=x1/2+x2/2;
        const ym=y1/2+y2/2;
        const steig=(x1-x2)/(y2-y1);
      return [[0,ym-steig*xm], [canvas.width,steig*(canvas.width-xm)+ym]]
    }
}
// Input: 2* (2 Punkte der Strecke), Output: Schnittpunkt
function schnitt(p1,p2,p3,p4){
    const [x1, y1, x2, y2] = [p1[0], p1[1], p2[0], p2[1]];
    const [x3, y3, x4, y4] = [p3[0], p3[1], p4[0], p4[1]];
    
    const xs = ((x4 - x3) * (x2 * y1 - x1 * y2) - (x2 - x1) * (x4 * y3 - x3 * y4)) /
               ((y4 - y3) * (x2 - x1) - (y2 - y1) * (x4 - x3));
    
    const ys = ((y1 - y2) * (x4 * y3 - x3 * y4) - (y3 - y4) * (x2 * y1 - x1 * y2)) /
               ((y4 - y3) * (x2 - x1) - (y2 - y1) * (x4 - x3));
    return [xs, ys]
}
// reset
function zeichnenZurücksetzen(){
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function zeichennVorbereiten(nrSchrittAnweisung){
    if (nrSchrittAnweisung>-1) {
        // middle and left point
        mlPoint(center);
        mlText(center, "F1");
        mlPoint(centerLeft);
        mlText(centerLeft, "F2");
    }
    if (nrSchrittAnweisung>0)
        // outer circle
        mlCircle(center, Rcircle);
}
function zeichnen(nrSchritt){
    // moving point
    let x=center[0]+Rcircle*Math.cos(angle);
    let y=center[0]+Rcircle*Math.sin(angle);
    if (nrSchritt>-1 && nrSchritt!=anweisungen.length-1) {
        mlPoint([x,y], 'green');
        mlText([x,y], "E");}
    if (nrSchritt>0 && nrSchritt!=anweisungen.length-1) {
        mlLine([x,y], center);}
    if (nrSchritt>1 && nrSchritt!=anweisungen.length-1) {
        mlLine([x,y], centerLeft);}
    // two circles
    if (nrSchritt>2 && nrSchritt!=anweisungen.length-1) {
        dist=((x-centerLeft[0])**2+(y-centerLeft[1])**2)**(1/2);
        mlCircle([x,y], dist);}
    if (nrSchritt>3 && nrSchritt!=anweisungen.length-1) {
        dist=((x-centerLeft[0])**2+(y-centerLeft[1])**2)**(1/2);
        mlCircle(centerLeft, dist);}
    // schnitt zwei kreise
    if (nrSchritt>4 && nrSchritt!=anweisungen.length-1) {
    const [pSchnittCircle1, pSchnittCircle2]=schnittCircle([x,y],centerLeft, dist)
    mlPoint(pSchnittCircle1, 'blue');
    mlPoint(pSchnittCircle2, 'blue');}
    // senkrecht
    if (nrSchritt>5 && nrSchritt!=anweisungen.length-1) {
        const [p1,p2]=mittelsenkrecht([x,y], centerLeft);
        console.log(p1,p2);
        const pSchnitt=schnitt(p1,p2,[x,y],center);
        if (points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
            points.pop(p1);
        }
        mlLine(p1, p2);}
    // schneiden
    if (nrSchritt>6) {
        const [p1,p2]=mittelsenkrecht([x,y], centerLeft);
        const pSchnitt=schnitt(p1,p2,[x,y],center);
        if (!points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
            points.push(pSchnitt);
        }
    }
    for (const p1 of points) {
        mlPoint(p1, 'red');
    }
}

// btnStartPause.addEventListener("click", () => {
//     if (intervalId === null) {
//         // Start the loop
//         intervalId = setInterval(() => {
//             a += step;
//             if (a >= maxValue) a -= maxValue; // Wrap around to 0 when exceeding maxValue
//             updateDisplay();
//         }, 1000);
//         btnStartPause.textContent = "Pause"; // Change button text to Pause
//     } else {
//         // Pause the loop
//         clearInterval(intervalId);
//         intervalId = null; // Clear the interval ID
//         btnStartPause.textContent = "Start"; // Change button text to Start
//     }
// });
function schrittMachen(vorwärts) {
    if (vorwärts) {
        if (nrSchrittAnweisung<anweisungenVorbereitung.length-1){
            nrSchrittAnweisung+=1;
        } else {
            nrSchritt+=1;
            if (nrSchritt===anweisungen.length) {
                nrSchritt=0;
                angle+=Math.PI/12;
            }
        }
    } else {
        if (nrSchritt===-1 && points.length===0 && nrSchrittAnweisung>-1) {
            nrSchrittAnweisung-=1;
        } else {
            if (nrSchritt>-1)
                nrSchritt-=1;
            if (nrSchritt===-1 && points.length>0) {
                nrSchritt=anweisungen.length-1;
                angle-=Math.PI/12;
            }
        }
    }
    pAnweisung.innerText='';
    if (nrSchrittAnweisung>-1)
        pAnweisung.innerText=`Vorbereitung ${nrSchrittAnweisung+1}: `+anweisungenVorbereitung[nrSchrittAnweisung];
    if (nrSchritt>-1)
        pAnweisung.innerText=`Schritt ${nrSchritt+1}: `+anweisungen[nrSchritt];
    zeichennVorbereiten(nrSchrittAnweisung);
    zeichnen(nrSchritt);
}
btnRückwärts.addEventListener("click", () => {
    zeichnenZurücksetzen();
    schrittMachen(false);
});
btnVorwärts.addEventListener("click", () => {
    zeichnenZurücksetzen();
    schrittMachen(true);
});
document.addEventListener("DOMContentLoaded", () => {
    zeichnenZurücksetzen();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        zeichnenZurücksetzen();
        schrittMachen(false);
    } else if (event.key === 'ArrowRight') {
        zeichnenZurücksetzen();
        schrittMachen(true);
    }
    // else if (event.key === '0') {
    //     startThread();}
});

// rückwärts, 