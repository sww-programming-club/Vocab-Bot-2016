(function($){
	var SelfLearning = true;
	var SlideFunctions = {};
	var Knowledge = {
		typePassage: {},
		typeDefinition: {},
		typeOpposite: {},
		typeSpelling: {},
		typeImage: {}
	};

	var DOMAIN = "https://www.vocabulary.com";
	var minifiedStatusHTML = '<div id="VBStatus"> <p id="Status">Initializing</p><div id="Info"> <p id="vb-efficiency">Efficiency <span class="vb-info-value">80%</span></p><p id="vb-knowledge-index">Knowledge Index <span class="vb-info-value">546</span></p><hr/> <p id="vb-associations">Associations<span class="vb-info-value">10</span></p><p id="vb-certainty">Certainty <span class="vb-info-value">50%</span></p></div></div>';
	var minifiedStatusCSS = '@import url(https://fonts.googleapis.com/css?family=Roboto:300);#VBStatus{-webkit-transition:all .3s;transition:all .3s;position:fixed;left:50%;top:100%;-webkit-transform:translateX(-50%) translateY(-60px);transform:translateX(-50%) translateY(-60px);width:250px;background-color:#ecf0f1;border-radius:20px 20px 0 0;padding:0 10px;opacity:.5}#VBStatus *{font-family:Roboto}#VBStatus #Status{text-align:center;font-weight:100;font-size:15pt}#VBStatus hr{border-color:#000}#VBStatus #Info p{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}#VBStatus #Info p span{-webkit-box-flex:1;-webkit-flex-grow:1;-ms-flex-positive:1;flex-grow:1;text-align:right}#VBStatus:hover{-webkit-transform:translateX(-50%) translateY(-100%);transform:translateX(-50%) translateY(-100%)}';
	var Next = $(".next");

	var StartingKnowledgeIndex = 0;
	var currentSlide;
	var Status;

	function ChangeStatus(StatusEnum) {
		var Enums = [
			{
				Name: "Error",
				Color: "#c0392b"
			},
			{
				Name: "Operating",
				Color: "#27ae60"
			},
			{
				Name: "Learning",
				Color: "#e67e22"
			},
			{
				Name: "Initializing",
				Color: "#ecf0f1"
			}
		];

		if (StatusEnum < Enums.length) {
			Status.find("#Status").text(Enums[StatusEnum].Name);
			Status.css("background-color", Enums[StatusEnum].Color);
		}
	}

	function ChangeStatusDebug(DebugStat, Value) {
		if (typeof DebugStat == "string") {
			Status.find("#vb-" + DebugStat + " span").text(Value);
		} else if (typeof DebugStat == "object") {
			var Stats = Object.keys(DebugStat);

			for (var i = 0; i < Stats.length; i++) {
				var Stat = Stats[i];
				var Value = DebugStat[Stats[i]];

				Status.find("#vb-" + Stat + " span").text(Value);
			}
		}
	}

	function GetKnowledgeIndex() {
		var Counter = 0;
		var KnowledgeTypes = Object.keys(Knowledge);

		for (type = 0; type < KnowledgeTypes.length; type++) {
			var Data = Knowledge[KnowledgeTypes[type]];
			var Indexes = Object.keys(Data);

			for (i = 0; i < Indexes.length; i++) {
				var Index = Data[Indexes[i]];

				if (typeof Index == "string") {
					Counter++;
				} else if (Array.isArray(Index)) {
					Counter += Index.length;
				}
			}
		}

		return Counter;
	}

	function GetNumAssociations(Question) {
		var Associations = 0;
		var KnowledgeTypes = Object.keys(Knowledge);

		for (var i = 0; i < KnowledgeTypes.length; i++) {
			var Data = Knowledge[KnowledgeTypes[i]];
			var AssociationsTo = Data[Question];

			if (Array.isArray(AssociationsTo)) {
				Associations += AssociationsTo.length;
			} else if (typeof AssociationsTo == "string") {
				Associations++;
			}

			Associations += $.map(Data, function(value, index) {
				return [value];
			}).filter(function(v) {
				return v == Question;
			}).length;
		}

		return Associations;
	}

	function simulate(element, eventName)
	{
		if (element instanceof jQuery)
			element = element[0];

		if (!eventName)
			eventName = "click";

	    var options = extend(defaultOptions, arguments[2] || {});
	    var oEvent, eventType = null;

	    for (var name in eventMatchers)
	    {
	        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
	    }

	    if (!eventType)
	        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

	    if (document.createEvent)
	    {
	        oEvent = document.createEvent(eventType);
	        if (eventType == 'HTMLEvents')
	        {
	            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
	        }
	        else
	        {
	            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
	            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
	            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
	        }
	        element.dispatchEvent(oEvent);
	    }
	    else
	    {
	        options.clientX = options.pointerX;
	        options.clientY = options.pointerY;
	        var evt = document.createEventObject();
	        oEvent = extend(evt, options);
	        element.fireEvent('on' + eventName, oEvent);
	    }
	    return element;
	}

	function extend(destination, source) {
	    for (var property in source)
	      destination[property] = source[property];
	    return destination;
	}

	var eventMatchers = {
	    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
	    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
	};

	var defaultOptions = {
	    pointerX: 0,
	    pointerY: 0,
	    button: 0,
	    ctrlKey: false,
	    altKey: false,
	    shiftKey: false,
	    metaKey: false,
	    bubbles: true,
	    cancelable: true
	};

	function Clone(Obj) {
		return $.extend(true, {}, Obj);
	}

	function GetSlideType(slide) {
		return slide.find(".question").attr("class").substring(9, 15);
	}

	function Continue(ContinueFunction) {
		if (!Next.hasClass("active")) return;

		simulate(Next);

		var Check = 0;
		var Interval = setInterval(function() {
			if (Next.hasClass("active")) {
				simulate(Next);
			} else if ($(".challenge-slide.active").find(".question").length <= 0 && Check < 5) {
				Check++;
			} else {
				clearInterval(Interval);

				if (typeof ContinueFunction == "function")
					setTimeout(ContinueFunction, 500);

				setTimeout(function() {
					currentSlide = $(".challenge-slide.active");

					if (!currentSlide || currentSlide.find(".question").length <= 0) {
						var FinishingKnowledgeIndex = GetKnowledgeIndex();

						console.log("Finished Round");
						console.log("Finishing Knowledge Index: " + FinishingKnowledgeIndex);
						console.log("Number of New Associations: " + (FinishingKnowledgeIndex - StartingKnowledgeIndex));
						console.log("Submitting Newfound Knowledge to Database");

						$.ajax({
						    url: 'https://script.google.com/macros/s/AKfycbx0yj6_umRiFHeAFizTVIsKfwDTerXOpT_bmhVQOLh6jDrNzTkv/exec',
						    type: 'post',
						    data: JSON.stringify(Knowledge),
						    contentType: 'text/plain',
						    success: function (data) {
						        console.log("Successfully Submitted Knowledge to Database");
								console.log("Response: " + data);
								console.log("Restarting...");

								setTimeout(function() {
									simulate($("a.button.ss-replay"));
								}, 250);
						    },
						    error: function(data) {
						    	console.log("An Error Occured While Submitting Knowledge to Database");
						    }
						});
					} else {
						evaluateSlide(currentSlide);
					}
				}, 250);
			}
		}, 1000);
	}

	function LogAnswer(slide, index, storageMethod, notLearning) {
		var StorageMethods = {};

		StorageMethods.Image = function(Continuation) {
			var Value = slide.find(".choices a.correct").css('background-image').replace('url(','').replace(')','').replace(/['"]/g,"");

			Knowledge.typeImage[index] = Value;

			console.log("Learned " + index + " refers to the URL: " + Value);
			console.log("Fact logged.");
			console.log("Current Database: ", Clone(Knowledge));

			Continuation();
		}

		StorageMethods.Spelling = function(Continuation) {
			var Value = slide.find(".sentence.complete strong:first").text();

			Knowledge.typeSpelling[index] = Value;

			console.log("Learned " + index + " eludes to the word \"" + Value + "\"");
			console.log("Fact logged.");
			console.log("Current Database: ", Clone(Knowledge));

			Continuation();
		}

		StorageMethods.Opposite = function(Continuation) {
			var Value = slide.find(".choices a.correct").text();

			if (!Knowledge.typeOpposite[index])
				Knowledge.typeOpposite[index] = [];

			Knowledge.typeOpposite[index].push(Value);

			console.log("Learned " + index + " is the opposite of " + Value);
			console.log("Fact logged.");
			console.log("Current Database: ", Clone(Knowledge));

			Continuation();
		}

		StorageMethods.Definition = function(Continuation) {
			var Value = slide.find(".choices a.correct").text();

			if (!Knowledge.typeDefinition[index])
				Knowledge.typeDefinition[index] = [];

			Knowledge.typeDefinition[index].push(Value);

			console.log("Learned " + index + " is equivalent to " + Value);
			console.log("Fact logged.");
			console.log("Current Database: ", Clone(Knowledge));

			Continuation();
		}

		StorageMethods.Passage = function(Continuation) {
			var Value = slide.find(".choices a.correct").text();

			Knowledge.typePassage[index] = Value;

			console.log("Learned " + index + " eludes to the word \"" + Value + "\"");
			console.log("Fact logged.");
			console.log("Current Database: ", Clone(Knowledge));

			Continuation();
		}

		if (!notLearning)
			ChangeStatus(2);

		var Check = setInterval(function() {
			if (slide.find(".status").hasClass("correct") || slide.find(".sentence").hasClass("complete")) {
				clearInterval(Check);
				StorageMethods[storageMethod](function() {
					ChangeStatus(1);
					setTimeout(Continue, 1000);
				});
			}
		}, 50);
	}

	function BruteForceMultipleChoice(slide) {
		var Options = slide.find(".choices a");
		var OptionNum = 0;

		var Interval = setInterval(function() {
			ChangeStatusDebug("certainty", Math.floor(1 / (4 - OptionNum) * 100) + "%");

			if (OptionNum > 3 || Options.hasClass("correct")) {
				clearInterval(Interval);
			} else {
				simulate(Options.eq(OptionNum));
				OptionNum++;
			}
		}, 600);
	}

	function SolveBySyntaxIdentification(slide) {
		var Options = slide.find(".choices a");
		var Word = slide.find(".sentence strong").text().toLowerCase();
		var Values = [];

		if (Word.length == 0)
			Word = slide.find(".instructions strong").text().toLowerCase();

		var Associations = Knowledge["type" + (GetSlideType(slide) == "typeA" ? "Opposite" : "Definition")][Word];

		if (!Associations) {
			Associations = Knowledge["type" + (GetSlideType(slide) == "typeA" ? "Opposite" : "Definition")][Word.slice(0, -1)];
			console.log("SolveBySyntaxIdentification: Trying Word Variation 1");
		}

		if (!Associations) {
			Associations = Knowledge["type" + (GetSlideType(slide) == "typeA" ? "Opposite" : "Definition")][Word.slice(0, -3)];
			console.log("SolveBySyntaxIdentification: Trying Word Variation 2");
		}

		if (!Associations) {
			Associations = Knowledge["type" + (GetSlideType(slide) == "typeA" ? "Opposite" : "Definition")][Word.slice(0, -3) + "e"];
			console.log("SolveBySyntaxIdentification: Trying Word Variation 3");
		}

		if (!Associations) {
			console.log("Association Not Found, Defaulting to Brute Force");
			BruteForceMultipleChoice(slide);
			return;
		}

		for (var i = 0; i < 4; i++) {
			var Index = [];
			var OptionWords = Options.eq(i).text().match(/[a-z][a-z][a-z]+/g) || [];

			for (var v = 0; v < Associations.length; v++) {
				var AssociationWords = Associations[v].match(/[a-z][a-z][a-z]+/g) || [];

				Index[v] = (AssociationWords.filter(function(el) {
		    		return OptionWords.indexOf(el) != -1;
				}).length / AssociationWords.length) || 0;
			}

			Values[i] = Math.max.apply(Math, Index);
		}

		var LargestCertainty = Math.max.apply(Math, Values);

		if (
			isNaN(LargestCertainty) ||
			LargestCertainty <= 0 ||
			LargestCertainty == Infinity ||
			LargestCertainty == -Infinity
		) {
			console.log("Cannot Find Correleation, Defaulting to Brute Force");
			BruteForceMultipleChoice(slide);
			return;
		}

		var SortedValues = Values.slice(0).sort(function(a, b) {return b - a});
		var SortedOptionNum = 0;

		console.log(Values, SortedValues);

		var Interval = setInterval(function() {
			if (SortedOptionNum > 3 || Options.hasClass("correct")) {
				clearInterval(Interval);
			} else {
				var OptionNum = Values.indexOf(SortedValues[SortedOptionNum]);

				ChangeStatusDebug("certainty", Math.floor(SortedValues[SortedOptionNum] * 100) + "%");
				console.log("Trying Option " + (OptionNum + 1));
				simulate(Options.eq(OptionNum));

				Values[OptionNum] = -1;

				if (Options.hasClass("correct") && SortedOptionNum == 0)
					console.log("Solved By Word Identification");

				SortedOptionNum++;
			}
		}, 600);
	}

	function EvauluateBestChoice(slide) {
		var slideType = GetSlideType(slide);
		if (slideType != "typeT" && slideType != "typeI") {
			var Options = slide.find(".choices a");
			var Words = Object.keys(Knowledge["type" + (slideType == "typeA" ? "Opposite" : "Definition")]);
			var DirectWordSearchSuccess;
			var IndirectWordSearchSuccess;
			var IndirectWordSearchSuccess2;

			for (var i = 0; i < 4; i++) {
				if (Words.indexOf(Options.eq(i).text().toLowerCase()) != -1) {
					DirectWordSearchSuccess = true;
					ChangeStatusDebug("certainty", "100%");
					simulate(Options.eq(i));
					console.log("Solved By Direct Word Search Evaluation!");

					setTimeout(function(){
						if (!slide.find(".status").hasClass("correct"))
							SolveBySyntaxIdentification(slide);
					}, 250);
					break;
				}
			}

			if (!DirectWordSearchSuccess) {
				for (var i = 0; i < 4; i++) {
					for (var k = 0; k < Words.length; k++) {
						if (Options.eq(i).text().toLowerCase().match(Words[k].toLowerCase())) {
							IndirectWordSearchSuccess = true;
							ChangeStatusDebug("certainty", "100%");
							simulate(Options.eq(i));
							console.log("Solved By Derivative Word Search Evaluation (Iteration 1)");

							setTimeout(function(){
								if (!slide.find(".status").hasClass("correct"))
									SolveBySyntaxIdentification(slide);
							}, 250);
							break;
						}
					}
				}
			}

			if (!DirectWordSearchSuccess && !IndirectWordSearchSuccess) {
				for (var i = 0; i < 4; i++) {
					for (var k = 0; k < Words.length; k++) {
						if (Options.eq(i).text().toLowerCase().match(Words[k].slice(0, -1).toLowerCase())) {
							IndirectWordSearchSuccess2 = true;
							ChangeStatusDebug("certainty", "100%");
							simulate(Options.eq(i));
							console.log("Solved By Derivative Word Search Evaluation (Iteration 2)");

							setTimeout(function(){
								if (!slide.find(".status").hasClass("correct"))
									SolveBySyntaxIdentification(slide);
							}, 250);
							break;
						}
					}
				}
			}

			if (!DirectWordSearchSuccess && !IndirectWordSearchSuccess && !IndirectWordSearchSuccess2)
				SolveBySyntaxIdentification(slide);
		} else {
			BruteForceMultipleChoice(slide);
		}
	}

	function ParseDefinition(Definition) {
		return Definition.replace(
			/\s*?\(.*?\)/g, ''
		).trim().replace(
			/(;(\s+)?)$/g, ""
		).replace(
			/;(\s*)?(or)?(\s*)?/g, "SEPARATOR"
		).split("SEPARATOR");
	}

	function notIndexed(table, value) {
		return table.indexOf(value) === -1;
	}

	SlideFunctions.typeF = function(slide) {
		var PassageKnowledge = Knowledge.typePassage;
		var Question = slide.find(".sentence:first").text();
		var Answer = PassageKnowledge[Question];

		ChangeStatusDebug("associations", GetNumAssociations(Question));

		if (Answer) {
			slide.find(".choices a").each(function(index) {
				if (Answer.toLowerCase() == $(this).text().toLowerCase()) {
					ChangeStatusDebug("certainty", "100%");
					simulate(this);
					setTimeout(Continue, 1000);
				}
			});
		} else if(SelfLearning) {
			EvauluateBestChoice(slide);
			LogAnswer(slide, Question, "Passage");
		} else {
			LogAnswer(slide, Question, "Passage")
		}
	}

	SlideFunctions.typeL = function(slide) {
		var DefinitionKnowledge = Knowledge.typeDefinition;
		var Word = slide.find(".sentence strong").text().toLowerCase();

		if (Word.length == 0)
			Word = slide.find(".instructions strong").text().toLowerCase();

		var Answers = DefinitionKnowledge[Word];

		ChangeStatusDebug("associations", GetNumAssociations(Word));
		console.log("typeL, Variant " + GetSlideType(slide), Word);

		if (Answers && Answers.length > 0) {
			var Options = slide.find(".choices a");

			for (var i = 0; i < 4; i++) {
				var Option = Options.eq(i);

				console.log(Option.text(), Answers.indexOf(Option.text()));
				if (Answers.indexOf(Option.text()) > -1) {
					ChangeStatusDebug("certainty", "100%");
					simulate(Option);
					setTimeout(Continue, 1000);
					setTimeout(function() {
						if (!Options.hasClass("correct")) {
							LogAnswer(slide, Word, "Definition");

							if (SelfLearning) {
								console.log("Did Not Continue");
								EvauluateBestChoice(slide);
							}
						}
					}, 250);
					break;
				} else if (i == 3) {
					console.log("Unfortunate");
					LogAnswer(slide, Word, "Definition");

					if (SelfLearning) {
						EvauluateBestChoice(slide);
					}
				}
			}
		} else if(SelfLearning) {
			EvauluateBestChoice(slide);
			LogAnswer(slide, Word, "Definition");
		} else {
			LogAnswer(slide, Word, "Definition");
		}
	}

	SlideFunctions.typeP = SlideFunctions.typeL;
	SlideFunctions.typeH = SlideFunctions.typeL;
	SlideFunctions.typeD = SlideFunctions.typeL;
	SlideFunctions.typeS = SlideFunctions.typeL;

	SlideFunctions.typeA = function(slide) {
		var OppositeKnowledge = Knowledge.typeOpposite;
		var Word = slide.find(".instructions strong").text().toLowerCase();
		var Answers = OppositeKnowledge[Word];

		ChangeStatusDebug("associations", GetNumAssociations(Word));
		console.log("typeA", Word);

		if (Answers && Answers.length > 0) {
			var Options = slide.find(".choices a");

			for (var i = 0; i < 4; i++) {
				var Option = $(Options[i]);
				if (Answers.indexOf(Option.text()) != -1) {
					ChangeStatusDebug("certainty", "100%");
					simulate(Option);
					setTimeout(Continue, 1000);
					if (!Options.hasClass("correct")) {
						LogAnswer(slide, Word, "Opposite");

						if (SelfLearning) {
							EvauluateBestChoice(slide);
						}
					}
					break;
				} else if (i == 3) {
					console.log("Unfortunate");

					LogAnswer(slide, Word, "Opposite");
					if (SelfLearning) {
						EvauluateBestChoice(slide);
					}
				}
			}
		} else if(SelfLearning) {
			EvauluateBestChoice(slide);
			LogAnswer(slide, Word, "Opposite");
		} else {
			LogAnswer(slide, Word, "Opposite");
		}
	}

	SlideFunctions.typeT = function(slide) {
		var SpellingKnowledge = Knowledge.typeSpelling;
		var Question = slide.find(".sentence").text();
		var Answer = SpellingKnowledge[Question];

		ChangeStatusDebug("associations", GetNumAssociations(Question));

		if (Answer) {
			ChangeStatusDebug("certainty", "100%");
			slide.find(".wordspelling").val(Answer);
			simulate(slide.find(".spellit"));
			setTimeout(Continue, 1000);
		} else if(SelfLearning) {
			var Value = slide.find(".sentence.complete strong:first").text();

			slide.find(".wordspelling").val(Value);
			simulate(slide.find(".spellit"));

			LogAnswer(slide, Question, "Spelling", true);
		} else {
			LogAnswer(slide, Question, "Spelling");
		}
	}

	SlideFunctions.typeI = function(slide) {
		var ImageKnowledge = Knowledge.typeImage;
		var Word = slide.find(".word").find(".wrapper").eq(0).clone().children().remove().end().text();
		var Answer = ImageKnowledge[Word];

		ChangeStatusDebug("associations", GetNumAssociations(Word));

		if (Answer) {
			ChangeStatusDebug("certainty", "100%");
			simulate(slide.find(".choices a").filter(function() {
				return $(this).css("background-image").match(Answer)
			}));
			setTimeout(Continue, 1000);
		} else if(SelfLearning) {
			EvauluateBestChoice(slide);
			LogAnswer(slide, Word, "Image");
		} else {
			LogAnswer(side, Word, "Image");
		}
	}

	function evaluateSlide(slide) {
		var SlideType = GetSlideType(slide);

		try {
			SlideFunctions[SlideType](slide);
		} catch(error) {
			ChangeStatus(0);
			console.log(error);
		}
	}

	function SearchDomainForAssociations() {
		var StatusObject = {};
		var SuccessObject = {};

		StatusObject.success = function(handler) {
			if (typeof handler == "function")
				SuccessObject.success = handler;

			return StatusObject;
		}

		StatusObject.failure = function(handler) {
			if (typeof handler == "function")
				SuccessObject.failure = handler;

			return StatusObject;
		}

		$.get(DOMAIN + $(".tabcontainer a:first").attr("href"), function(data) {

			var HTMLData = $($.parseHTML(data));
			var Matches = HTMLData.find("a.word.dynamictext").length;
			var NumDone = 0;

			HTMLData.find("a.word.dynamictext").each(function(index) {
				var word = $(this).text();

				if (!Knowledge.typeDefinition[word])
					Knowledge.typeDefinition[word] = [];

				if (!Knowledge.typeOpposite[word])
					Knowledge.typeOpposite[word] = [];

				$.get(DOMAIN + $(this).attr("href"), function(data) {
					var wordPage = $($.parseHTML(data));

					wordPage.find(".ordinal .sense > .definition").each(function(index) {
						var Definitions = ParseDefinition($(this).eq(0).clone().children().remove().end().text());

						for (var i = 0; i < Definitions.length; i++) {
							var Definition = Definitions[i];
							if (notIndexed(Knowledge.typeDefinition[word], Definition)) {
								Knowledge.typeDefinition[word].push(Definition);
								console.log("Defining " + word + " as " + Definition);
							}
						}
					});

					wordPage.find(".ordinal .defContent").each(function(index) {
						var Instances = $(this).find(".instances");

						Instances.each(function(index) {
							var Instance = $(this);
							var instanceType = Instance.find("dt:first").text().slice(0, -1);

							if (instanceType.length == 0) {
								instanceType = index > 0 ? Instances.eq(index - 1).find("dt:first").text().slice(0, -1) : "Synonyms";
								Instance.find("dt:first").text(instanceType + ":");
							}

							Instance.find(".word").each(function(index) {
								var Association = $(this).text();

								if (
									(instanceType == "Synonyms" || instanceType == "Types" || instanceType == "Type of") &&
									notIndexed(Knowledge.typeDefinition[word], Association)
								) {
									Knowledge.typeDefinition[word].push(Association);
									console.log("Associating " + word + " with " + Association);
								} else if(instanceType == "Antonyms" && notIndexed(Knowledge.typeOpposite[word], Association)) {
									Knowledge.typeOpposite[word].push(Association);
									console.log("Associating " + word + " as the opposite of " + Association);
								}
							});

							Instance.find(".definition").each(function(index) {
								var Associations = ParseDefinition($(this).text());

								if (instanceType == "Synonyms" || instanceType == "Types" || instanceType == "Type of") {
									for (var i = 0; i < Associations.length; i++) {
										var Association = Associations[i];
										if (notIndexed(Knowledge.typeDefinition[word], Association)) {
											Knowledge.typeDefinition[word].push(Association);
											console.log("Associating " + word + " with " + Association);
										}
									}
								} else if (instanceType == "Antonyms") {
									for (var i = 0; i < Associations.length; i++) {
										var Association = Associations[i];
										if (notIndexed(Knowledge.typeOpposite[word], Association)) {
											Knowledge.typeOpposite[word].push(Association);
											console.log("Associating " + word + " as the opposite of " + Association);
										}
									}
								}
							});
						});
					});

					NumDone++;
					if (NumDone == Matches) {
						console.log("Done");
						if (typeof SuccessObject.success == "function")
							SuccessObject.success();
					}
				}).fail(function() {
					console.log("GET Request Failed");
					if (typeof SuccessObject.failure == "function")
						SuccessObject.failure();
				});
			});
		}).fail(function() {
			console.log("GET Request Failed");
			if (typeof SuccessObject.failure == "function")
				SuccessObject.failure();
		});

		return StatusObject;
	}

	function StartEvaluation() {
		StartingKnowledgeIndex = GetKnowledgeIndex();

		console.log("Beginning Evaluation");
		console.log("Knowledge Index: " + StartingKnowledgeIndex, "Current Knowledge of Set", Knowledge);

		ChangeStatusDebug("knowledge-index", StartingKnowledgeIndex);
		ChangeStatus(1);

		currentSlide = $(".challenge-slide.active");
		evaluateSlide(currentSlide);
	}

	function Setup() {

		$("<style type='text/css'> " + minifiedStatusCSS + " </style>").appendTo("head");

		Status = $(minifiedStatusHTML).css("z-index", 9999999).appendTo("html");

		ChangeStatus(3);
		ChangeStatusDebug({
			"efficiency": "Uncalculated",
			"knowledge-index": "Uncalculated",
			"associations": "Uncalculated",
			"certainty": "Uncalculated"
		});

		$.get(DOMAIN + $(".tabcontainer a:first").attr("href"), function(data) {
			var Words = [];

			$($.parseHTML(data)).find("a.word.dynamictext").each(function(index) {
				var word = $(this).text().toLowerCase();
				Words.push(word);
			});

			$.get(
				"https://script.google.com/macros/s/AKfycbx0yj6_umRiFHeAFizTVIsKfwDTerXOpT_bmhVQOLh6jDrNzTkv/exec?Vocabulary=" +
				Words.join("&Vocabulary="),
				function(data) {
					Knowledge = data;
					console.log("Obtained Relevant Knowledge:", data);

					SearchDomainForAssociations().success(function() {
						console.log("Successfully Searched the Domain for Associations to Vocabulary Set!");
						StartEvaluation();
					}).failure(function() {
						console.log("Domain Search Failed");
					});
				}
			)
		}).fail(function() {
			console.log("GET Request Failed");
		});
	}

	Setup();
})(jQuery);
