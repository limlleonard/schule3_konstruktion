const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const board=document.getElementById("board");
canvas.width = board.offsetWidth;
canvas.height = board.offsetHeight;

const F11=[canvas.width/2, canvas.height/2] // F1 Ellipse
const F21=[F11[0]-canvas.width/5,F11[1]]
const F12=[canvas.width*3/4, canvas.height/2]; //F1 für Hyperbel
const F22=F11;
const F=F11; // F für parabel
const yParabel=canvas.height*3/4;
const rEllipse=canvas.width/2*0.8;
const rHyperbel=canvas.width/6;
const rParabel=canvas.width/8;
const Rpoint=5; // der Radius einer Punkte
const angles=[[],[],[]];
for (let a = Math.PI; a < 3 * Math.PI; a += Math.PI / 12) {
    angles[0].push(a);
}
for (let a = Math.PI; a < Math.PI*5/4; a += Math.PI / 15) {
    angles[1].push(a);
    if (a!==Math.PI) angles[1].push(-a);
}
// Es ist kein Winkel, aber wird es so genannt für die Einheitlichkeit
for (let x = 0; x <= canvas.width/2; x += canvas.width/8) {
    angles[2].push(x);
    if (x!==0) angles[2].push(-x);
}
let xParabel=canvas.width/2;
let angle=Math.PI; // Winkel der bewegende Punkt auf dem großen Kreis
let points=[]; // Finale Punkte
const pAnweisung = document.getElementById("anweisung");

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
function mlLine(p1,p2,color='white'){
    ctx.beginPath();
    ctx.moveTo(...p1);
    ctx.lineTo(...p2);
    ctx.strokeStyle=color;
    ctx.stroke();
}
function mlText(p1,text) {
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.fillText(text, p1[0]+10, p1[1]+16);
}
function mlStrecke2Gerade(point1, point2, w, h) {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) {
        // The two points are identical; no unique line can be defined.
        throw new Error("The two points must be distinct.");
    }
    const intersections = [];
    // Calculate intersection with the left edge (x = 0)
    if (dx !== 0) {
        const y = y1 + (0 - x1) * dy / dx;
        if (y >= 0 && y <= h) {
            intersections.push([0, y]);
        }
    }
    // Calculate intersection with the right edge (x = w)
    if (dx !== 0) {
        const y = y1 + (w - x1) * dy / dx;
        if (y >= 0 && y <= h) {
            intersections.push([w, y]);
        }
    }
    // Calculate intersection with the top edge (y = 0)
    if (dy !== 0) {
        const x = x1 + (0 - y1) * dx / dy;
        if (x >= 0 && x <= w) {
            intersections.push([x, 0]);
        }
    }
    // Calculate intersection with the bottom edge (y = h)
    if (dy !== 0) {
        const x = x1 + (h - y1) * dx / dy;
        if (x >= 0 && x <= w) {
            intersections.push([x, h]);
        }
    }
    if (intersections.length !== 2) {
        throw new Error("Line does not properly intersect the box at two points.");
    }
    return intersections;
}

// Input, center of two circles and the radius / distnace. Ouput: zwei schnittpunkte
function schnittKreise(p1, p2, distance) {
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
function schnittGerade(p1,p2,p3,p4){
    const [x1, y1, x2, y2] = [p1[0], p1[1], p2[0], p2[1]];
    const [x3, y3, x4, y4] = [p3[0], p3[1], p4[0], p4[1]];
    const xs = ((x4 - x3) * (x2 * y1 - x1 * y2) - (x2 - x1) * (x4 * y3 - x3 * y4)) /
               ((y4 - y3) * (x2 - x1) - (y2 - y1) * (x4 - x3));
    const ys = ((y1 - y2) * (x4 * y3 - x3 * y4) - (y3 - y4) * (x2 * y1 - x1 * y2)) /
               ((y4 - y3) * (x2 - x1) - (y2 - y1) * (x4 - x3));
    return [xs, ys]
}
function abstand(p1,p2) {
    return ( (p1[0]-p2[0])**2+(p1[1]-p2[1])**2 ) **0.5
}
// reset
function schwarz(){
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const vorbereitungen=[
    [
        "Zwei Punkte F1 und F2 festlegen",
        "Ein Kreis um F1 ziehen (F2 muss im Kreis sein)"
    ],
    [
        "Zwei Punkte F1 und F2 festlegen",
        "Ein Kreis um F1 ziehen (F2 muss außerhalb vom Kreis sein)"
    ],
    [
        "Ein Punkt und eine Gerade festlegen",
    ],
]
const anweisungen=[
    [
        "Einen beliebigen Punkt E auf dem Kreislinie festlegen",
        "Die Strecke EF1 ziehen",
        "Die Strecke EF2 ziehen",
        "Ein Kreis um E mit r=EF2 ziehen",
        "Ein Kreis um F2 mit r=EF2 ziehen",
        "Die 2 Kreisen schneiden sich auf 2 Punkte",
        "Eine Gerade durch die 2 Schnittpunkte ziehen (Mittelsenkrechte)",
        "schneidet die Strecke EF2 auf S",
        "Diese Vorfahren wiederholen"
    ],
    [
        'Einen beliebigen Punkt E auf dem Kreislinie festlegen',
        'Die Gerade EF1 ziehen',
        'Die Strecke EF2 ziehen',
        'Ein Kreis um E mit r=EF2 ziehen',
        'Ein Kreis um F2 mit r=EF2 ziehen',
        'Die 2 Kreisen schneiden sich auf 2 Punkte',
        'Eine Gerade durch die 2 Schnittpunkte ziehen (Mittelsenkrechte)',
        'schneidet die Gerade EF1 auf S',
        'Diese Vorfahren wiederholen'
    ],
    ['Einen beliebigen Punkt B auf l festlegen',
    'Ein Kreis um B mit r ziehen',
    'Es schneidet die Gerade auf B1 und B2',
    'Ein Kreis um B1 mit 2r ziehen',
    'Ein Kreis um B2 mit 2r ziehen',
    'Die zwei Kreisen schneiden sich auf 2 Punkte',
    'Eine Gerade durch die 2 Punkte ziehen (Eine Senkrechte durch B)',
    'Die Strecke BF ziehen',
    'Ein Kreis um B mit r=BF ziehen',
    'Ein Kreis um F mit r=BF ziehen',
    'Die zwei Kreisen schneiden sich auf 2 Punkte',
    'Eine Gerade durch die 2 Punkte ziehen (Mittelsenkrecht von BF)',
    'Die Mittelsenkrechte und die Senkrechte schneiden sich auf S (gesucht)',
    'Diese Vorfahren wiederholen']
]
let nrVorbereitung=-1 // am Anfang wird nichts in der Anweisung gezeigt
let nrAnweisung=-1
let nrRunde=0 // n. Punkte zu zeichnen
let mode=0;
function zurücksetzen() {
    mode=document.getElementById('mode').value;
    if (mode==2) {angle=0;} else {angle=Math.PI;}
    points=[];
    nrVorbereitung=-1;
    nrAnweisung=-1;
    nrRunde=0;
    pAnweisung.innerText='';
    schwarz();
}
function zeichnenVorbereiten(mode, nrVorbereitung){
    if (mode==0) {
        if (nrVorbereitung>-1) {
            // middle and left point
            mlPoint(F11);
            mlText(F11, "F1");
            mlPoint(F21);
            mlText(F21, "F2");
        }
        if (nrVorbereitung>0)
            // outer circle
            mlCircle(F11, rEllipse);
    } else if (mode==1) {
        if (nrVorbereitung>-1) {
            // middle and left point
            mlPoint(F12);
            mlText(F12, "F1");
            mlPoint(F22);
            mlText(F22, "F2");
        }
        if (nrVorbereitung>0)
            mlCircle(F12, rHyperbel);
    } else if (mode==2) {
        if (nrVorbereitung>-1) {
            // middle and left point
            mlPoint(F);
            mlText(F, "F");
            mlLine([0, yParabel], [canvas.width, yParabel]);
            mlText([0, yParabel], "l");
        }
    }
}
function zeichnenEllipse(nrAnweisung, angle) {
    // moving point
    let x=F11[0]+rEllipse*Math.cos(angle);
    let y=F11[1]+rEllipse*Math.sin(angle);
    if (nrAnweisung!=anweisungen[mode].length-1) {
        // beim letzten Schritt wird die Hilfszeichnungen nicht gezeigt
        if (nrAnweisung>-1) {
            mlPoint([x,y], 'green');
            mlText([x,y], "E");}
        if (nrAnweisung>0) {
            mlLine([x,y], F11);}
        if (nrAnweisung>1) {
            mlLine([x,y], F21);}
        // two circles
        if (nrAnweisung>2) {
            dist=abstand([x,y], F21);
            mlCircle([x,y], dist);}
        if (nrAnweisung>3) {
            dist=abstand([x,y], F21);
            mlCircle(F21, dist);}
        // schnitt zwei kreise
        if (nrAnweisung>4) {
        const [pSchnittCircle1, pSchnittCircle2]=schnittKreise([x,y],F21, dist)
        mlPoint(pSchnittCircle1, 'blue');
        mlPoint(pSchnittCircle2, 'blue');}
        // senkrecht
        if (nrAnweisung>5) {
            const [p1,p2]=mittelsenkrecht([x,y], F21);
            const pSchnitt=schnittGerade(p1,p2,[x,y],F11);
            if (points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
                points.pop(p1);
            }
            mlLine(p1, p2);}
    }
    // schneiden
    if (nrAnweisung>6) {
        const [p1,p2]=mittelsenkrecht([x,y], F21);
        const pSchnitt=schnittGerade(p1,p2,[x,y],F11);
        if (!points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
            points.push(pSchnitt);
        }
    }
    for (const p1 of points) {
        mlPoint(p1, 'red');
    }
}
function zeichnenHyperbel(nrAnweisung, angle) {
    // moving point
    let x=F12[0]+rHyperbel*Math.cos(angle);
    let y=F12[1]+rHyperbel*Math.sin(angle);
    if (nrAnweisung!=anweisungen[mode].length-1) {
        if (nrAnweisung>-1) {
            mlPoint([x,y], 'green');
            mlText([x,y], "E");}
        if (nrAnweisung>0) {
            const [p1, p2]=mlStrecke2Gerade([x,y], F12, canvas.width, canvas.height);
            mlLine(p1,p2);}

        if (nrAnweisung>1) {
            mlLine([x,y], F22);}
        // two circles
        if (nrAnweisung>2) {
            dist=((x-F22[0])**2+(y-F22[1])**2)**(1/2);
            mlCircle([x,y], dist);}
        if (nrAnweisung>3) {
            dist=((x-F22[0])**2+(y-F22[1])**2)**(1/2);
            mlCircle(F22, dist);}
        // schnitt zwei kreise
        if (nrAnweisung>4) {
        const [pSchnittCircle1, pSchnittCircle2]=schnittKreise([x,y],F22, dist)
        mlPoint(pSchnittCircle1, 'blue');
        mlPoint(pSchnittCircle2, 'blue');}
        // senkrecht
        if (nrAnweisung>5) {
            const [p1,p2]=mittelsenkrecht([x,y], F22);
            const pSchnitt=schnittGerade(p1,p2,[x,y],F12);
            if (points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
                points.pop(p1);
            }
            mlLine(p1, p2);}
    }
    // schneiden
    if (nrAnweisung>6) {
        const [p1,p2]=mittelsenkrecht([x,y], F22);
        const pSchnitt=schnittGerade(p1,p2,[x,y],F12);
        if (!points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
            points.push(pSchnitt);
        }
    }
    for (const p1 of points) {
        mlPoint(p1, 'red');
    }
}
function zeichnenParabel(nrAnweisung, angle) {
    // moving point
    let x=canvas.width/2+angle;
    let y=yParabel;
    if (nrAnweisung!=anweisungen[mode].length-1) {
        if (nrAnweisung>-1) {
            mlPoint([x,y], 'green');
            mlText([x,y], "B");}
        if (nrAnweisung>0) {
            mlCircle([x,y], rParabel);}
        if (nrAnweisung>1) {
            mlPoint([x-rParabel,y]);
            mlText([x-rParabel,y], "B1");
            mlPoint([x+rParabel,y]);
            mlText([x+rParabel,y], "B2");}
        // two circles
        if (nrAnweisung>2) {
            mlCircle([x-rParabel,y], rParabel*2)
        }
        if (nrAnweisung>3) {
            mlCircle([x+rParabel,y], rParabel*2)
        }
        // schnitt zwei kreise
        if (nrAnweisung>4) {
        const [pSchnittCircle1, pSchnittCircle2]=schnittKreise([x+rParabel,y],[x-rParabel, y], rParabel*2);
        mlPoint(pSchnittCircle1, 'blue');
        mlPoint(pSchnittCircle2, 'blue');}
        // senkrecht
        if (nrAnweisung>5) {
            [p1,p2]=mittelsenkrecht([x+rParabel,y],[x-rParabel, y]);
            mlLine(p1,p2);
            // if (points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
            //     points.pop(p1);
        }
        if (nrAnweisung>6) {
            mlLine([x,y],F);
        }
        if (nrAnweisung>7) {
            dist=abstand([x,y],F)
            mlCircle([x,y],dist);
        }
        if (nrAnweisung>8) {
            dist=abstand([x,y],F)
            mlCircle(F,dist);
        }
        if (nrAnweisung>9) {
            dist=abstand([x,y],F);
            const [pSchnittCircle3, pSchnittCircle4]=schnittKreise([x,y],F, dist);
            mlPoint(pSchnittCircle3, 'blue');
            mlPoint(pSchnittCircle4, 'blue');
        }
        if (nrAnweisung>10) {
            [p1,p2]=mittelsenkrecht([x+rParabel,y],[x-rParabel, y]);
            [p3,p4]=mittelsenkrecht([x,y],F);
            const pSchnitt=schnittGerade(p1,p2,p3,p4);
            if (points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
                points.pop(p1);
            }
            mlLine(p3,p4);
        }
    }
    // schneiden
    if (nrAnweisung>11) {
        [p1,p2]=mittelsenkrecht([x+rParabel,y],[x-rParabel, y]);
        [p3,p4]=mittelsenkrecht([x,y],F);
        const pSchnitt=schnittGerade(p1,p2,p3,p4);
        if (!points.some(point => point[0] === pSchnitt[0] && point[1] === pSchnitt[1])) {
            points.push(pSchnitt);
        }
    }
    for (const p1 of points) {
        mlPoint(p1, 'red');
    }
}
function zeichnen(mode, nrSchritt, angle){
    if (mode==0) { // Ellipse
        zeichnenEllipse(nrSchritt, angle);
    } else if (mode==1) {
        zeichnenHyperbel(nrSchritt, angle);
    } else if (mode==2) {
        zeichnenParabel(nrSchritt, angle);
    }
}

function schrittMachen(vorwärts) {
    if (vorwärts) {
        if (nrVorbereitung<vorbereitungen[mode].length-1){
            nrVorbereitung+=1;
        } else if (nrRunde<angles[mode].length-1 || nrAnweisung<anweisungen[mode].length-1) {
            nrAnweisung+=1;
            if (nrAnweisung===anweisungen[mode].length) {
                nrAnweisung=0;
                nrRunde+=1;
                angle=angles[mode][nrRunde];
            }
        }
    } else {
        if (nrAnweisung===-1 && points.length===0 && nrVorbereitung>-1) {
            nrVorbereitung-=1;
        } else {
            if (nrAnweisung>-1)
                nrAnweisung-=1;
            if (nrAnweisung===-1 && points.length>0) {
                nrAnweisung=anweisungen[mode].length-1;
                nrRunde-=1;
                angle=angles[mode][nrRunde];
            }
        }
    }
    pAnweisung.innerText='';
    if (nrVorbereitung>-1)
        pAnweisung.innerText=`Vorbereitung ${nrVorbereitung+1}: `+vorbereitungen[mode][nrVorbereitung];
    if (nrAnweisung>-1)
        pAnweisung.innerText=`Schritt ${nrAnweisung+1}: `+anweisungen[mode][nrAnweisung];
    schwarz();
    zeichnenVorbereiten(mode, nrVorbereitung);
    zeichnen(mode, nrAnweisung, angle);
}
document.addEventListener("DOMContentLoaded", () => {
    zurücksetzen();
    schwarz();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        schrittMachen(false);
        event.preventDefault();
    } else if (event.key === 'ArrowRight') {
        schrittMachen(true);
        event.preventDefault();
    }
});
