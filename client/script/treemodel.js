/**
 * Constructor of: User
 * @param name 		(String) user name
 * @param picture 	(String) picture path (client/img/picture_x.png)
 * @returns a new User
 */
function User(name, picture){
	this.name 		= name;
	this.picture	= picture;
}

/**
 * Constructor of: Publication
 * @param pubId		(int) publication's id
 * @param content	(String) the "body" of the publication
 * @param children	(int[]) list with all children
 * @param authorId	(int) author's id
 * @param parent	(int) parent's id
 * @param name		(String) name displayed in the svg area
 * @returns a new Publication
 */
function Publication(pubId, content, children , authorId, parent, name){
	this.pubId		= pubId;
	this.authorId 	= authorId;
	this.children	= children;
	this.content	= content;
	this.parent		= parent;
	this.name		= name == undefined ? content : name;
}

/**
 * Constructor of: Question
 * @param pubId			Publication.id
 * @param content		Publication.content
 * @param children		Publication.children
 * @param authorId		Publication.authorId
 * @param parent		Publication.parent
 * @param category		(int) id of the category
 * @param title			(String) question's title & Publication.name
 * @returns a new Question
 */function Question(pubId, content, children , authorId, parent, category, title){
	Publication.call(this, pubId, content, children , authorId, parent, title);
	this.category 		= category;
	this.title			= title;
}

Question.prototype = Object.create(
	Publication.prototype, {
		constructor:{
			value : Question,
			enumerable : true,
			writable : true,
			configurable : true
		}
	}
);

/**
 * Constructor of: Answer
 * @param pubId			Publication.id
 * @param content		Publication.content
 * @param children		Publication.children
 * @param authorId		Publication.authorId
 * @param questionId	Publication.parent
 * @returns a new Answer
 */function Answer(pubId, content, children , authorId, questionId){
	Publication.call(this, pubId, content, children , authorId, questionId, content.substring(0, 20));
}

Answer.prototype = Object.create(
	Publication.prototype, {
		constructor:{
			value : Answer,
			enumerable : true,
			writable : true,
			configurable : true
		}
	}
);

/**
 * Constructor of: Argument
 * @param pubId 		Publication.id
 * @param content		Publication.content
 * @param children		Publication.children
 * @param authorId		Publication.authorId
 * @param answerId		Publication.parent
 * @param agree			(bool) flag used to indicate if the argument is agree or not with an answer (its parent)
 * @returns a new Argument
 */function Argument(pubId, content, children , authorId, answerId, agree){
	Publication.call(this, pubId, content, children , authorId, answerId, content.substring(0, 20));
	this.agree		= agree;
}

Argument.prototype = Object.create(
	Publication.prototype, {
		constructor:{
			value : Argument,
			enumerable : true,
			writable : true,
			configurable : true
		}
	}
);


/**
 * Constructor of: CoordScreen
 * @param x 	(int) the position on X axis
 * @param y		(int) the position on Y axis
 * @returns a new CoordScreen (a point on the screen)
 */
function CoordScreen(x, y){
	this.x = x;
	this.y = y;
}

/**
 * Converts a point in Euclidean Space to a point in Screen Space.
 * Projection on the screen (finite plane)
 **/
CoordScreen.prototype.projectEStoSS = function(point){
	this.x = Math.round(point.x * max.x) + origin.x;
    this.y = Math.round(point.y * max.y) + origin.y;
};

/**
 * Constructor of: CoordEuclideanSpace
 * @param x		(float) the position on X axis
 * @param y 	(float) the position on Y axis
 * @returns a new CoordEuclideanSpace (position relative to the center, expressed by number in [0; 1].
 * 0 means close to the center while 1 means close to the borderline 
 */function CoordEuclideanSpace(x, y){
	this.x 		= x;
	this.y 		= y;
	this.valid 	= true;
}

 /**
  * Converts a point in Hyperbolic Space to a point if Euclidean Space
  */
CoordEuclideanSpace.prototype.projectHStoES = function(){
	this.x = tanh(this.x);
	this.y = tanh(this.y);
};

/**
 * Converts a point in Screen Space to  a point in Euclidean Space
 **/
CoordEuclideanSpace.prototype.projectSStoES = function(x, y){
    var ex = parseFloat(x - origin.x) / parseFloat(max.x);
    var ey = parseFloat(y - origin.y) / parseFloat(max.y);
    if (Math.pow(ex, 2) + Math.pow(ey, 2) < 1.0) {
		this.x = ex;
        this.y = ey;
        this.valid = true;
    }
    else {
		this.valid = false;
    }
}

/**
 * Translate the current point by the coordinates of the given point. 
 **/
CoordEuclideanSpace.prototype.translate = function(coord){
	var x2 = parseFloat(coord.x);
	var y2 = parseFloat(coord.y);
	var denX = (this.x * x2) + (this.y * y2) + 1;
    var denY = (this.y * x2) - (this.x * y2) ;    
    var dd   = Math.pow(denX, 2) + Math.pow(denY, 2);
	var numX = this.x + x2;
	var numY = this.y + y2;
    this.x = ((numX * denX) + (numY * denY)) / dd;
    this.y = ((numY * denX) - (numX * denY)) / dd;
}

/**
 * Applies the tanh function:
 * tanh(z)  = (e^z - e^-z)/(e^z + e^-z)
 * 			= (e^2z - 1)/(e^2z + 1)
 * 			= (1 - e^-2z)/(1+e^-2z)
 * @param x
 * @returns tanh(x)
 */
function tanh(x){
	x = Math.exp(2 * x);
    x = (x - 1) / (x + 1);
    return x;
}


/**
 * Constructor of: RelNode
 * @param node		(Publication)
 * @param parent	(Publication)
 * @returns a new relational node.
 * A relational node is a wrapper for a Publication, which is expressed as a 'physical' entity:
 * it has coordinates, a weight, and children
 * It's not really a graphical representation (@see DrawnNode), it's only used to represent links between nodes
 */
function RelNode(node, parent){
	this.coordinates		= new CoordEuclideanSpace(0.0, 0.0);
	this.radiusReduction 	= new CoordEuclideanSpace(0.0, 0.0);
	this.node 				= node;
	this.parent 			= parent;
	this.weight				= 1.0;
	this.totalWeight 		= 1.0;
	this.children 			= null;
	if(node.children != undefined){
		this.children		= new Array();
		this.totalWeight	= 0.0;
	    for (var i = 0; i < node.children.length; i++) {
			switch(node.constructor.name){
				case 'Question':
					this.children.push(new RelNode(answersMap.get(node.children[i]), this));
					break;
				case 'Answer':
					this.children.push(new RelNode(argumentsMap.get(node.children[i]), this));
					break;
				case 'Publication':
					this.children.push(new RelNode(questionsMap.get(node.children[i]), this));
					break;
			}
	     }
		 for(var i = 0; i < this.children.length; i++){
			 this.totalWeight += this.children[i].weight;
			 if(this.totalWeight != 0.0){
				 this.weight += Math.log(this.totalWeight);
			 }
		}
	}
}

/**
 * Places this relational node in an hyperbolic space (and its children if it's lot a leaf)
 **/
RelNode.prototype.layoutNode = function(angle, width){
	if(this.parent == null){
		this.radiusReduction.x = radius;
		this.radiusReduction.y = 0.0;
		this.radiusReduction.projectHStoES();
	}
	else{
		this.coordinates.x = length * Math.cos(angle);
		this.coordinates.y = length * Math.sin(angle);
		this.coordinates.projectHStoES();
	    this.coordinates.translate(this.parent.coordinates);
	    this.radiusReduction.x = (length + radius) * Math.cos(angle);
	    this.radiusReduction.y = (length + radius) * Math.sin(angle);
	    this.radiusReduction.projectHStoES();
	    this.radiusReduction.translate(this.parent.coordinates);
	}
    if(this.node.children != undefined){
    	if(this.parent != null && width > Math.PI) {
			width = Math.PI;
	    }
	    var startAngle = angle - (width / 2.0);
	    for (var i = 0; i < this.children.length; i++) {
	        var childWidth = width * (this.children[i].weight / parseFloat(this.totalWeight)); //computes the width according to its weight
			var childAngle = startAngle + (childWidth / 2.0);
			this.children[i].layoutNode(childAngle, childWidth);
	        startAngle += childWidth;
	    }
    }
}


/**
 * Constructor of: DrawnNode
 * @param relNode	(RelNode) the relational node to draw
 * @returns	a new DrawnNode
 * A DrawnNode is a wrapper for a RelNode, which is expressed as a graphical entity.
 */
function DrawnNode(relNode){
	this.relNode 				= relNode;
	this.currentCoordInES 		= new CoordEuclideanSpace(relNode.coordinates.x, relNode.coordinates.y);
	this.currentRadiusCoordInES = new CoordEuclideanSpace(relNode.radiusReduction.x, relNode.radiusReduction.y);
	this.exCoordInES			= new CoordEuclideanSpace(this.currentCoordInES.x, this.currentCoordInES.y);
	this.exRadiusCoordInES		= new CoordEuclideanSpace(this.currentRadiusCoordInES.x, this.currentRadiusCoordInES.y);
	this.coordinates			= new CoordScreen(0, 0);
	switch(relNode.node.constructor.name){
		case 'Publication':
			this.color = '#FF0000';
			break;
		case 'Question':
		case 'Answer':
			this.color = getRandomColor();
			break;
		case 'Argument':
			this.color = relNode.node.agree ? '#00FF00' : '#FF0000';
		break;
	}		
	this.children = null;
	if(this.relNode.node.children != undefined){
		this.children = new Array();
	    for (var i = 0; i < this.relNode.children.length; i++) {
			this.children.push(new DrawnNode(this.relNode.children[i]));
	    }
	}
}

/**
 * Updates this node's position
 */
DrawnNode.prototype.refreshCoordinates	= function(){
	this.coordinates.projectEStoSS(this.currentCoordInES);
	if(this.relNode.node.children != undefined){
		for(var i = 0; i < this.children.length; i++){
			this.children[i].refreshCoordinates();
		}
	}
};


/**
 * Draws all links between this node and its children (if there are), and asks every child to do the same
 */
DrawnNode.prototype.drawBranches		= function(){
	if(this.relNode.node.children == undefined)return;
    for (var i = 0; i < this.children.length; i++) {
        drawBranch(this.coordinates, this.children[i].coordinates);
        this.children[i].drawBranches();
    }
};

/**
 * Draws children
 **/
DrawnNode.prototype.drawNodes			= function(){
	var distance = parseFloat(Math.pow(this.currentRadiusCoordInES.x - this.currentCoordInES.x, 2) + Math.pow(this.currentRadiusCoordInES.y - this.currentCoordInES.y, 2));
    var coeff = parseFloat(Math.sqrt(distance) / parseFloat(radius));
    if(this.relNode.parent == null){
    	coeff *= 2;
    }
    drawNode(coeff, this);
    if(this.relNode.node.children != undefined){
    	for(var i = 0; i < this.children.length; i++){
    		this.children[i].drawNodes();
    	}
    }
};

/**
 * Moves a node according to the given vector (delta X, deltaY)
 * Moves children
 */
DrawnNode.prototype.translateNode		= function(coordES){
	this.currentCoordInES.x = this.exCoordInES.x;
	this.currentCoordInES.y = this.exCoordInES.y;
	this.currentCoordInES.translate(coordES);
	this.currentRadiusCoordInES.x = this.exRadiusCoordInES.x;
	this.currentRadiusCoordInES.y = this.exRadiusCoordInES.y;
	this.currentRadiusCoordInES.translate(coordES);
	if(this.relNode.node.children != undefined){
		for(var i = 0; i < this.children.length; i++){			
			this.children[i].translateNode(coordES);
		}
	}
};

/**
 * Stops the translation, and stops all children
 */
DrawnNode.prototype.stopTranslateNode	= function(){
	this.exCoordInES.x = this.currentCoordInES.x;
	this.exCoordInES.y = this.currentCoordInES.y;
	this.exRadiusCoordInES.x = this.currentRadiusCoordInES.x;
	this.exRadiusCoordInES.y = this.currentRadiusCoordInES.y;
	if(this.relNode.node.children != undefined){
		for(var i = 0; i < this.children.length; i++){
			this.children[i].stopTranslateNode();
		}
	}
};


