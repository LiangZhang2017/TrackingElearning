var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
//creates a new socket.io instance attached to the http server.
var io = require('socket.io')(http);
const jsonQuery = require('json-query');
const jsonPath=require('jsonpath');
const sortJsonArray = require('sort-json-array');
const readline = require('readline');

const { Readable } = require('stream');
//build the connection with LRS
var request=require("request");
var httplrs=require('http');
const { callbackify } = require('util');
const { UsageState } = require('webpack');
const { response } = require('express');
const { prependOnceListener } = require('process');
const lrs = require('./lrsconfig').config;
const classInfor=require('./classInfor').classInf;


//Provide the absolute path to the dist directory.
app.use(express.static('./dist'));

//On get request send 'index.html' page as a response.
app.get('/', function(req, res) {
   res.sendFile(__dirname +'/visulization.html');
});

//Whenever someone connects this gets executed
var username=lrs.user;
var password=lrs.password;
//const endpoint=lrs.endpoint+"statements/search?";
const endpoint="https://record.x-in-y.com/keith-s-pilot/xapi/statements/search?",
dataSqlObj=new Object();
//filter object
var startTim = new Date(Date.now()-1000*500*60);
var endTim = new Date(Date.now()+1000*6000);
const start=startTim.getTime();
const end=endTim.getTime();
date=new Object();
date["date"]=startTim;
//console.log(new Date());

dataSqlObj["statement.timestamp"]={"$gt":{"$parseDate":date}};

var path=JSON.stringify(dataSqlObj);
console.log(path);
var url=endpoint+"mode=v2"+"&query="+encodeURI(path);
console.log(url);
var auth = "Basic " + Buffer.from(username + ":" + password).toString("base64");
console.log(auth);
  //Request to Veracity LRS database
  var options = {
    "method" : "GET",
    "url" : url,
    "headers": {
              'ContentType' : 'application/json',
              'Authorization': auth //formed by the crypto authentication
            } 
  };

io.on('connection', function (socket) {
    
    interval=800;
    timer = setInterval(function() {
            getStatements();
        }, interval);
    //getStatements();
    function getStatements(){

      var statements=[];
  
      //build the connection with LRS, and do get request
      var req=request(options, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                // Print out the response body
                //console.log(JSON.parse(body));
                //callback(error, response, body);
                var readable = Readable.from(body);
                
                readable.on('data', (chunk) => {
                    statements.push(chunk);
                    //console.log(chunk);
                  });
                
                readable.on('end', () => {
                  //console.log(chunk);
                  //console.log(statements[0]);
                });
                
                //console.log(statements);
                  // (async function() {
                  //     for await (const chunk of readable) {
                  //       console.log(chunk);
                  //     }
  
                  //   })();
  
                mySts=JSON.parse(body);
  
                result=JSON.stringify(mySts,null,4);
                lenObj=Object.keys(JSON.parse(result)).length;
                console.log(lenObj);
                
                //sort the array of statements, and collect their statement id and timestamp.
                colUuid=[];
                colTime=[];
                guids=[];
                verbs=[];
                mesgSpeak={};
                studentNames=[];
                visulScoresLabel=[];
                visulScoreValues=[];

                visualQuestionLabel=[];
                visualLatencyValue=[];

                actions=[];
                latencys=[];
                visualQuestionLabelRep=[];
                visualStuNames=[];
                visualClassNames=[];
                summary={};
                visualQAs=[];
  
                //console.log(sortJsonArray(mySts,'timestamp'));
  
                //Iteration query the parameters
                for (var p=0; p<lenObj;p++){
                  var stsTemp=mySts[p];
                  colUuid.push(stsTemp.id);
                  colTime.push(stsTemp.timestamp);

                  verbId=stsTemp.verb.id;
                  verbArr=verbId.split('/');
                  verb=verbArr[verbArr.length-1];
                  verbs.push(verb);
  
                  switch (verb) {
                    case "speak":
                      //get the guid
                      console.log("speak");
                      mbox=stsTemp.actor.mbox;
                      var separators = ['@', ':'];
                      mboxArr = mbox.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      guid=JSON.stringify(mboxArr[1]);
                      var className;
                      for (var i=0;i<classInfor.length;i++){
                        if(classInfor[i].guid==guid){
                          console.log(classInfor[i].guid==guid);
                          className=classInfor[i].Title;
                        }
                      };
                      visualClassNames.push("className:  "+className);
                      guids.push(guid);
  
                      //get speak message
                      var other=stsTemp.context.contextActivities.other;
                      var extensions=other[0].definition.extensions;
                      var jp = require('jsonpath');
                      var mesg = jp.query(extensions, '$..action');
                      var endoFSpeechTime=jp.query(extensions, '$..endoFSpeechTime');
                      var speaker=jp.query(extensions, '$..id');
  
                      //get student name 
                      object=stsTemp.object.mbox;
                      var separators = ['@', ':'];
                      mboxArr = object.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      studenName=mboxArr[1];
                      studentNames.push("studentName: "+studenName);

                      //get the actions
                      time=stsTemp.timestamp;
                      actorName=stsTemp.actor.name;
                      objectCont=stsTemp.object.name;
                      stringAct=time+"    "+actorName+"   speak   "+objectCont;
                      actions.push(stringAct);
                      
                      break;
                    case "transition":
                      console.log("transition");
                      mbox=stsTemp.actor.mbox;
                      var separators = ['@', ':'];
                      mboxArr = mbox.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      guid=JSON.stringify(mboxArr[1]);
                      guids.push(guid);
                      var className;
                      for (var i in classInfor){
                        if(classInfor[i].guid==guid){
                          className=classInfor[i].Title;
                        }
                      };
                      visualClassNames.push("className:  "+className);
  
                      //get student name 
                      object=stsTemp.object.id;
                      var separators = ['@', ':'];
                      mboxArr = object.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      studenName=mboxArr[1];
                      studentNames.push("studentName: "+studenName);

                      //get the actions
                      time=stsTemp.timestamp;
                      actorName=stsTemp.actor.name;
                      objectCont=stsTemp.object.definition.name;
                      stringAct=time+"   "+actorName+"   transition   "+objectCont['en-US'];
                      actions.push(stringAct);
  
                      break;
                    case "matchAnswer":
                      console.log("matchAnswer");
                      object=stsTemp.object.id;
                      guids.push(object);
                      var className;
                      for (var i in classInfor){
                        if(classInfor[i].guid==object){
                          className=classInfor[i].Title;
                        }
                      };
                      visualClassNames.push("className:  "+className);
  
                      var score=stsTemp.result.score.raw;
                      var extensions=stsTemp.result.extensions;
                      var jp = require('jsonpath');
                      var AnswerType = jp.query(extensions, '$..AnswerType');
                      var input = jp.query(extensions, '$..input');
  
                      mbox=stsTemp.actor.mbox;
                      var separators = ['@', ':'];
                      mboxArr = mbox.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      studenName=mboxArr[1];
                      studentNames.push("studentName: "+studenName); 

                      //get the actions
                      time=stsTemp.timestamp;
                      actorName=stsTemp.actor.name;
                      objectCont=stsTemp.object.id;
                      stringAct=time+"    "+actorName+"   matchAnswer   "+objectCont;
                      actions.push(stringAct);
  
                      break;
                    case "respond":
                      console.log("respond");
                      object=stsTemp.object.mbox;
                      var separators = ['@', ':'];
                      mboxArr = object.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      guid=JSON.stringify(mboxArr[1]);
                      guids.push(guid);
                      var className;
                      for (var i in classInfor){
                        if(classInfor[i].guid==guid){
                          className=classInfor[i].Title;
                        }
                      };
                      visualClassNames.push("className:  "+className);
  
                      //get the answer
                      var other=stsTemp.context.contextActivities.other;
                      var extensions=other[0].definition.extensions;
                      var jp = require('jsonpath');
                      var mesg = jp.query(extensions, '$..action');
                      var latency=Number(jp.query(extensions, '$..latency'));
                      var speaker=jp.query(extensions, '$..id');
                      var timeInput=jp.query(extensions, '$..inputoFText');
                      var question=jp.query(extensions, '$..Question');
                      var response=jp.query(extensions, '$..Response');
                      
                      var visualQA="Q: "+question+"A: "+response;
                      visualQAs.push(visualQA);

                      var latencyJson={"question":question,"latency":latency};
                      latencys.push(latencyJson);

                      //get student name 
                      mbox=stsTemp.actor.mbox;
                      var separators = ['@', ':'];
                      mboxArr = mbox.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      studenName=mboxArr[1];
                      studentNames.push("studentName: "+studenName);

                      var questionRep=JSON.stringify(question[0]).slice(0,20);
                      visualQuestionLabelRep.push(questionRep);
                      visualQuestionLabel.push(question);
                      visualLatencyValue.push(latency/1000);

                      //get the actions
                      time=stsTemp.timestamp;
                      actorName=stsTemp.actor.name;
                      objectCont=stsTemp.object.name;
                      stringAct=time+"   "+ actorName+"   respond   "+objectCont;
                      actions.push(stringAct);
  
                      break;
                    case "Evaluate":
                      console.log("Evaluate");
                      mbox=stsTemp.actor.mbox;
                      var separators = ['@', ':'];
                      mboxArr = mbox.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      guid=JSON.stringify(mboxArr[1]);
                      guids.push(guid);
                      var className;
                      
                      for (var i in classInfor){
                        if(classInfor[i].guid==guid){
                          className=classInfor[i].Title;
                        }
                      };
                      visualClassNames.push("className:  "+className);
  
                      //get student name 
                      object=stsTemp.object.id;
                      var separators = ['@', ':'];
                      mboxArr = object.split(new RegExp('[' + separators.join('') + ']', 'g'));
                      studenName=mboxArr[1];
                      studentNames.push("studentName: "+studenName);

                      result=stsTemp.result.score.raw;
                      console.log(result);
                      
                      time=stsTemp.timestamp;
                      visulScoresLabel.push(time);
                      visulScoreValues.push(result);

                      //get the actions
                      time=stsTemp.timestamp;
                      actorName=stsTemp.actor.name;
                      objectCont=stsTemp.object.definition.name['en-US'];
                      stringAct=time+"    "+actorName+"    Evaluate    "+objectCont;
                      actions.push(stringAct);
  
                      break;
                    default:
                      break;
                  }
                  
                  // var t='https://app.skoonline.org/ITSProfile/Extensions/other';
                  // var other=stsTemp.context.contextActivities.other;
                  // var extensions=other[0].definition.extensions;
  
                }
                //collect all the variables that needed for rendering
                // console.log(colUuid);
                 console.log(colTime);
                 //console.log(verbs);
                // console.log(guids);
                //console.log(visualClassNames);
                //console.log(visulScoresLabel);
                //console.log(visulScoreValues);
                //console.log(visualQuestionLabelRep);
                //console.log(visualLatencyValue.length);
                //console.log(visualLatencyValue);
                //console.log(actions);
                numOfQues=visulScoreValues.length;
                var totalSum = 0;
                for(var i in visulScoreValues) {
                    totalSum += visulScoreValues[i];
                }
                AverageScore=totalSum/numOfQues;
                
                lastTime=colTime.reverse()[0];

                summary={
                  "NumofQuestions":numOfQues,
                  "AverageScore":AverageScore,
                  "presentLast":lastTime,
                }
  
  //###########################################Visulization#################################################################################################
                var strData;
                strData = {
                  "label": visulScoresLabel,
                  "value": visulScoreValues
                }
                
                var strData2;
                strData2={
                  "label": visualQuestionLabelRep,
                  "value": visualLatencyValue
                };

                socket.emit('latencys', strData2);

                socket.emit('news', strData);

                socket.emit('actions',actions);

                socket.emit('StudentNames',studentNames);

                socket.emit('ClassNames',visualClassNames);

                socket.emit('summary',summary);

                socket.emit('visualQAs',visualQAs);
                
                console.log("Subscribing..");
  
              }else{
                console.log("Fail to do request")
              }
          });
    }
  
});
//server listening on port 9000
http.listen(9000, function() {
   console.log('listening on *:9000');
   console.log("http://localhost:9000");
});
