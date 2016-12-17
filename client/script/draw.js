const length		= 0.4;
const radius		= 0.06;
const charsColor	= '0123456789ABCDEF';
const callback		= function(evt){
	evt = evt || window.event;
	drag(evt);
};

var max				= undefined;
var origin			= undefined;
var startPoint 		= new CoordEuclideanSpace(0.0, 0.0);
var endPoint		= new CoordEuclideanSpace(0.0, 0.0);
var translation		= new CoordEuclideanSpace(0.0, 0.0);
var tooltip 		= undefined;
var root			= undefined;
var drawnRoot		= undefined;
var width			= undefined;
var height			= undefined;

/**
 * Places the root on the screen
 * @param node		(Publication) the root
 * First function -> performs initializations
 */
function setRootNode(node){
	// initializes variables according to the HTML doc
	width = parseInt(document.getElementById('svgarea').getBoundingClientRect().width);
	height = parseInt(document.getElementById('svgarea').getBoundingClientRect().height);
	max = new CoordScreen(width / 2, height / 2);
	origin = new CoordScreen(max.x, max.y);
	
	//initializes the root
	root = new RelNode(node, null);
	root.layoutNode(0.0, Math.PI * 2);
	drawnRoot = new DrawnNode(root, this);
	
	//set listeners
	document.getElementById('svgarea').addEventListener('mousedown', function(evt){
		evt = evt || window.event;
		startPoint.projectSStoES(evt.pageX, evt.pageY);
		document.getElementById('svgarea').addEventListener('mousemove', callback);
	});
	document.getElementById('svgarea').addEventListener('mouseup', function(){
		document.getElementById('svgarea').removeEventListener('mousemove', callback);
		drawnRoot.stopTranslateNode();
	});

	tooltip = d3.selectAll(".tooltip:not(.css)");
	d3.select('#svgarea').select('g')
	    .selectAll('circle')
	    .on("mouseover", function () {
	        tooltip.style("opacity", "1");
	        tooltip.style("color", this.getAttribute("fill"));      
	    })
	    .on("mouseout", function () {
	        return tooltip.style("opacity", "0");
	    });
}

/**
 * Initializes the drawing process:
 * - clear the scene
 * - updates root's coordinates (domino effect, because every child will be updated)
 * - draws branches				(same here)
 * - draws children				(and here)
 */
function draw(){
	d3.select('#svgarea').select('g').selectAll('*').remove();
	drawnRoot.refreshCoordinates();
	drawnRoot.drawBranches();
	drawnRoot.drawNodes();
}

/**
 * Draws a branch
 * @param startCoord 	(CoordScreen) X,Y of the first point
 * @param endCoord		(CoordScreen)X,Y of the second point
 */
function drawBranch(startCoord, endCoord){
	d3.select('#svgarea').select('g').append('line').
		attr('pointer-events', 'none').
		attr('x1', startCoord.x).
		attr('y1', startCoord.y).
		attr('x2', endCoord.x).
		attr('y2', endCoord.y).
		attr('stroke','#FFFFFF').
		attr('clip-path', 'url(#cut-box)');
}

/**
 * Draws a node (circle)
 * @param coeff		(float) radius reduction
 * @param drawnNode	(DrawnNode) the node to draw
 */
function drawNode(coeff, drawnNode){
	var minMax = parseFloat(Math.min(max.x, max.y));
    var tmpRadius = parseInt(Math.round(radius * minMax * coeff));
  //the circle
    d3.select('#svgarea').select('g').append('circle').
		attr('fill', drawnNode.color).
		attr('cx', drawnNode.coordinates.x).
		attr('cy', drawnNode.coordinates.y).
		attr('r', 2 * tmpRadius).
		attr('clip-path', 'url(#cut-box)').
		attr('id', drawnNode.relNode.node.pubId).
		on('click', function(){
			onClickOnCircle(drawnNode.relNode.node);
	    });
    //the tooltip
    var g = d3.select('#svgarea').select('g').append('g').attr('class', 'tooltip css').attr('transform','translate('+ drawnNode.coordinates.x +','+ drawnNode.coordinates.y+ ')');
    g.append('rect').attr('x', '-3em').attr('y','-45').attr('width', '6em').attr('height', '1.25em');
    g.append('text').attr('y', '-45').attr('dy','1em').attr('text-anchor', 'middle').attr('fill', '#FFFFFF').text(drawnNode.relNode.node.name);
}

/**
 * Moves the root
 * @param coord		(CoordES) the translation vector (deltaX, deltaY)
 */
function translate(coord){
	drawnRoot.translateNode(coord);
	draw();
}

/**
 * Callback function, called when a 'mousemove' Event is fired
 * @param evt the event
 */
function drag(evt){
	if(startPoint.valid){
		endPoint.projectSStoES(evt.pageX, evt.pageY);
		if(endPoint.valid){
			translation.x = endPoint.x - startPoint.x;
			translation.y = endPoint.y - startPoint.y;
			translate(translation);
		}
	}
}

/**
 * Computes a pseudo random number representing a color
 * @returns an hex number, such as: #xxyyzz
 */
function getRandomColor(){
	var length = 6;
	var hex = '#';
	while(length--){
		hex += charsColor[(Math.random() * 16) | 0];
	}
	return hex;
}
