var usersMap 		= new Map();
var questionsMap 	= new Map();
var answersMap 		= new Map();
var argumentsMap 	= new Map();
var categories      = new Map();
var divDiscussion 	= undefined;
var fieldset		= undefined;
var textarea 		= undefined;
var form 			= undefined;

//constants: some IDs
const title_input_id	= 'title_input';
const select_input_id	= 'select_category';
const label0_id			= 'label0';
const label1_id			= 'label1';

/**
 * Attached to the body
 * <body onload="onload()">
 * ...
 * </body>
 * Gets some DOM elements and send an asynchronous request to fetch data
 */
function onload(){
	divDiscussion 	= document.getElementById('pubarea');
	fieldset 		= document.getElementsByTagName('fieldset')[0];
	textarea 		= document.getElementById('contentpub_input');
	form 			= document.getElementById('formpub');
	send(readResponse);
}

/**
 * An helper method used to clean the <fieldset> built dynamically according to the clicked node
 * @param idElement
 * @returns
 */
function removeFromFieldset(idElement){
	var element = document.getElementById(idElement);
	if(element != undefined){
		fieldset.removeChild(element);
	}
}

/**
 * Called when a node is clicked
 * @param node (Publication) publication wrapped inside the RelNode wrapped inside the clicked node
 */
function onClickOnCircle(node){
	//clean the page
	removeFromFieldset(title_input_id);
	removeFromFieldset(select_input_id);
	removeFromFieldset(label0_id);
	removeFromFieldset(label1_id);
	while(divDiscussion.hasChildNodes()){
		divDiscussion.removeChild(divDiscussion.lastChild);
	}
	//redraw the <fieldset>
	switch(node.constructor.name){
	case 'Argument':
		textarea.placeholder= 'Please enter your question';
		var answer = answersMap.get(node.parent);
		if(answer != undefined){
			var question = questionsMap.get(answer.parent);
			if(question!= undefined){
				drawDivision(0, question, 1);
				drawDivision(1, answer, 2);
			}
		}
	case 'Publication':		
		form.action 		= ('/watson/display?type=question&id='+node.pubId);
		var title 			= document.createElement('input');
		title.name 			= 'title';
		title.type 			= 'text';
		title.placeholder 	= 'Please enter a title';
		title.id			= title_input_id;
		textarea.placeholder= 'Please enter your question';
		var select 			= document.createElement('select');
		select.id			= select_input_id;
		select.name			= 'category';
		for(var [key, value] of categories){
			var option = document.createElement('option');
			option.value = value;
			option.text = value;
			select.appendChild(option);
		}
		fieldset.insertBefore(select, textarea);
		fieldset.insertBefore(title, select);
		break;
	case 'Question':
		form.action = ('/watson/display?type=answer&id='+node.pubId);
		textarea.placeholder= 'Please enter your answer';
		break;
	case 'Answer':
		form.action 		= ('/watson/display?type=argument&id='+node.pubId);
		var radio			= document.createElement('input');
		radio.type			= 'radio';
		radio.name			= radio.value = 'agree';
		var label 			= document.createElement('label');
		label.id			= label0_id;
		label.innerHTML 	= 'I agree';
		label.appendChild(radio);
		fieldset.insertBefore(label, textarea);
		var radio1 			= document.createElement('input');
		radio1.type			= 'radio';
		radio1.name			= 'agree';
		radio1.value 		= 'disagree';
		radio1.checked 		= true;
		var label1 			= document.createElement('label');
		label1.id			= label1_id;
		label1.innerHTML 	= 'I disagree';
		label1.appendChild(radio1);
		fieldset.insertBefore(label1, label);
		textarea.placeholder= 'Please enter your argument';
		var parent = questionsMap.get(node.parent);
		if(parent != undefined){
			drawDivision(0, parent, 1);
		}
		break;
	}
	//draws the discussion stream
	addDiscussionStream(node);
}

/**
 * Sends an asynchronous GET request to fetch data
 * @param callback (function) the callback function executed when the request ends
 */
function send(callback){
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function(){
		if(xmlHttp.readyState === XMLHttpRequest.DONE && xmlHttp.status === 200){
			callback(xmlHttp.responseText);
		}
	}
	xmlHttp.open("GET", "/watson/getdata", true);
	xmlHttp.send(null);
}

/**
 * The callback function passed as parameter in the previous method
 * @param response		(String) request's response (JSON tree with all publications)
 * Parse this Tree and updates nodes
 * TODO At the moment, it's a only a sample JSON file with no updated, but if the app uses a database, the tree should be parsed
 * and used to update the tree
 */			
function readResponse(response){
	var tree			= JSON.parse(response).tree;
	var treeRoot		= tree.root;	
	var questionsArray 	= null;	
	if(treeRoot.questions != null){
		questionsArray = new Array();
		for(var i = 0; i < treeRoot.questions.length; i++){
			var question = treeRoot.questions[i];
			var answersArray = null;
			if(question.answers != null){
				answersArray = new Array();
				for(var j = 0; j < question.answers.length; j++){
					var answer = question.answers[j];
					var argumentsArray = null;
					if(answer.arguments != null){
						argumentsArray = new Array();
						for(var k = 0; k < answer.arguments.length; k++){
							var arg = answer.arguments[k];
							argumentsMap.set(parseInt(arg.pubId), new Argument(parseInt(arg.pubId), arg.content, null, parseInt(arg.authorId), parseInt(answer.pubId), parseInt(arg.agree)));
							argumentsArray.push(parseInt(arg.pubId));
						}
					}
					answersMap.set(parseInt(answer.pubId), new Answer(parseInt(answer.pubId), answer.content, argumentsArray , parseInt(answer.authorId), parseInt(question.pubId)));
					answersArray.push(parseInt(answer.pubId));
				}
			}
			questionsMap.set(parseInt(question.pubId), new Question(parseInt(question.pubId), question.content, answersArray , parseInt(question.authorId), question.parent, parseInt(question.category), question.title));
			questionsArray.push(parseInt(question.pubId));
		}
	}
	if(tree.users != null){
		for(var i = 0; i < tree.users.length; i++){
			var user = tree.users[i];
			usersMap.set(parseInt(user.id), new User(user.name, user.picture));
		}
	}
	if(tree.categories != null){
		for(var i = 0; i < tree.categories.length; i++){
			var cat = tree.categories[i];
			categories.set(parseInt(cat.id), cat.name);
		}
	}
	var pub = new Publication(0, treeRoot.name, questionsArray, null, null);
	setRootNode(pub);
	draw();
	onClickOnCircle(pub);
}

/**
 * Repaints the discussion stream <div>
 * @param root		(Publication) At the first time, when you call yourself this function, this root is the root of the stream (it's not the general root, it's the node from which you want to display
 * the discussion stream. fFr example, you can display the stream from a question. The stream is then composed of question's answers and answers' arguments). The function is recursive and will call
 * itself the function for every child.
 * @param pOdd 		(int) flag used to alternate colors
 * 
 */
function addDiscussionStream(root, pOdd){
	if(root == undefined)return;
	var odd = pOdd == undefined ? 0 : pOdd;
	var map = undefined;
	var level;
	switch(root.constructor.name){
	case 'Publication':
		map = questionsMap;
		level = 0;
		break;
	case 'Question':
		map = answersMap;
		level = 1;
		break;
	case 'Answer':
		map = argumentsMap;
		level = 2;
		break;
	case 'Argument':
		level = 3;
		break;
	}
	if(level != 0){
		drawDivision(odd, root, level);
		if(level == 3)return;
	}
	for(var [key, child] of map){
		if(root.pubId == 0 || child.parent == root.pubId){
			odd++;
			addDiscussionStream(child, odd);
		}
	}
}

/**
 * Draws one <div> in the discussion stream <div>. It contains only one Publication
 * @param odd		(int) flag used to alternate colors (0 | 1) 
 * @param value		(Publication) the node to draw
 * @param level		(int) represents the depth of the publication (1 | 2 | 3) -> (Question | Answer | Argument)
 * @returns
 */
function drawDivision(odd, value, level){
	var user			= usersMap.get(value.authorId);
	var newDiv 			= document.createElement('div');
	newDiv.id			= value.pubId;
	newDiv.className	= 'divpublication' + (odd % 2);
	switch(level){
	case 1:
		newDiv.style.margin	= '5px 5px 5px 5px';
		break;
	case 2:
		newDiv.style.margin	= '5px 5px 5px 25px';
		break;
	case 3:
		newDiv.style.margin	= '5px 5px 5px 45px';
		newDiv.style.borderColor = value.agree ? '#00FF00' : '#FF0000';
		break;
	}
	var newImg			= document.createElement('img');
	newImg.src			= user.picture;
	newImg.alt			= usersMap.get(value.authorId).picture;
	newImg.className	= 'imgAvatar';
	
	var newPName		= document.createElement('span');
	newPName.appendChild(document.createTextNode(user.name));
	newPName.className	= 'pubAuthorTitle';
	
	var newPTitle		= document.createElement('span');
	newPTitle.appendChild(document.createTextNode(value.name));
	newPTitle.className	= 'pubAuthorTitle';
	
	var newPubContent	= document.createElement('span');
	newPubContent.appendChild(document.createTextNode(value.content));
	
	newDiv.appendChild(newImg);
	newDiv.appendChild(newPName);
	newDiv.appendChild(document.createElement('br'));
	newDiv.appendChild(newPTitle);
	newDiv.appendChild(document.createElement('br'));
	newDiv.appendChild(newPubContent);
	
	divDiscussion.appendChild(newDiv);
}
