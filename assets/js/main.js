// Generated by CoffeeScript 1.8.0
var callbacks, check_for_new_game, currAttack, currentFight, currentQuestion, data, data_, e, fight_attack, fight_attack_tooltip, fight_change_vals, fight_check_question, fight_enemy_attack, fight_parse_inline_vars, fight_question, fight_start, get_JSON, init, load_attacks, load_creatures, load_questions, load_story, notify, parse_inline_vars, parse_story, parse_story_element, play_sound, pop, random, reset, reset_test, set_character, set_name, set_storyline, show_choose_creature, skip_tut;

document.addEventListener("polymer-ready", function() {
  var drawerPanel, navicon;
  navicon = document.getElementById("navicon");
  drawerPanel = document.getElementById("drawerPanel");
  navicon.addEventListener("click", function() {
    drawerPanel.togglePanel();
  });
  init();
});

data = {};

data_ = {};

callbacks = {};

currentFight = 'noFightRunning';

currentQuestion = {};

currAttack = {};

try {
  console.log("Init soundcloud");
  SC.initialize({
    client_id: "bb72e01542b2481b1ed0c625951bcb03"
  });
} catch (_error) {
  e = _error;
  console.log("soundcloud failed");
}

play_sound = function(sound_id) {
  try {
    SC.stream(sound_id, function(sound) {
      return sound.play();
    });
  } catch (_error) {
    e = _error;
    console.log("You probably don't have any or a good network connection");
  }
  localStorage.story_pos = parseInt(localStorage.story_pos) + 1;
  return parse_story();
};

callbacks = {
  log_hey: function() {
    return console.log("Hey");
  }
};

$("#dialog_choose_name").on("change", function() {
  return set_name();
});

get_JSON = function(what, where) {
  data_ = void 0;
  return $.getJSON("assets/data/" + what + ".json", function(json) {
    data_ = json;
    return data[where] = data_;
  });
};

load_story = function() {
  console.log("loading story");
  return $.getJSON("assets/data/" + localStorage.storyline + "-story.json", function(json) {
    data.story = json;
    return load_attacks();
  });
};

load_questions = function() {
  console.log("loading questions");
  return $.getJSON("assets/data/" + data.creatures[localStorage.character].basestats.type + "-questions.json", function(json) {
    return data.questions = json;
  });
};

load_attacks = function() {
  console.log("loading attacks");
  return $.getJSON("assets/data/attacks.json", function(json) {
    data.attacks = json;
    return load_creatures();
  });
};

load_creatures = function() {
  console.log("Hey I am loading the creatures");
  return $.getJSON("assets/data/creatures.json", function(json) {
    data.creatures = json;
    load_questions();
    return parse_story();
  });
};

reset = function() {
  localStorage.clear();
  return window.location.reload();
};

reset_test = function() {
  localStorage.clear();
  return window.location.replace("/");
};

random = function(from, to) {
  var res;
  console.log("from: " + from);
  console.log("to: " + to);
  res = Math.floor((Math.random() * to) + from);
  console.log("number: " + res);
  return res;
};

function Fight (enemy, enemy_lvl) {
	this.character = localStorage.character;
	this.player_lvl = parseInt(localStorage.lvl);
	this.enemy = enemy;
	this.enemy_lvl = enemy_lvl;

	this.player_description = data.creatures[this.character].description;
	this.enemy_description = data.creatures[this.enemy].description;

	//Keeps track of health
	this.player_health = Math.round(parseInt(data.creatures[this.character].basestats.hp) * parseInt(localStorage.lvl) / 33);
	this.enemy_health = Math.round(parseInt(data.creatures[this.enemy].basestats.hp) * parseInt(enemy_lvl) / 33);
	this.player_basehealth = this.player_health;
	this.enemy_basehealth = this.enemy_health;

	//Keeps track type and multipliers and attacks
	this.player_type = data.creatures[this.character].basestats.type;
	this.enemy_type = data.creatures[this.enemy].basestats.type;

	this.player_attack_multiplier = 1.0;
	this.enemy_attack_multiplier = 1.0;
	this.player_defense_multiplier = 1.0;
	this.enemy_defense_multiplier = 1.0 ;

	this.player_attacks = data.creatures[this.character].attacks;
	this.enemy_attacks = data.creatures[this.enemy].attacks;

	//keeps track of whos turn it is
	this.turn = 'player';
	this.victim = 'enemy';

	this.switch_turn = function () {
		console.log("running switch_turn");
		console.log("currentFight.turn was " + this.turn);
		if (this.turn == 'player') {
			this.turn = 'enemy';
			this.victim = 'player';
			$(".select_attack > .attack_btns > paper-button").attr("disabled", "");
			fight_enemy_attack();
		} else {
			this.turn = 'player';
			this.victim  = 'enemy';
			$(".select_attack > .attack_btns > paper-button").removeAttr("disabled");
		}
		console.log("currentFight.turn is now " + this.turn);
	};

	this.update_health = function () {
		$(".fight_area > .creatures > .player > paper-progress").attr("value", Math.round(this.player_health / this.player_basehealth * 100));
		$(".fight_area > .creatures > .enemy > paper-progress").attr("value", Math.round(this.enemy_health / this.enemy_basehealth * 100));
	};

	this.set_display = function () {
		//setting h1 with names and lvl of creatures and tooltips
		$('.fight_area > .creatures > .player > h1 > core-tooltip > span.name').html(this.character);
		$('.fight_area > .creatures > .enemy > h1 > core-tooltip > span.name').html(this.enemy);
		$('.fight_area > .creatures > .player > h1 > span.lvl > span').html(this.player_lvl);
		$('.fight_area > .creatures > .enemy > h1 > span.lvl > span').html(this.enemy_lvl);
		$('.fight_area > .creatures > .player > h1 > core-tooltip').attr("label", this.player_description);
		$('.fight_area > .creatures > .enemy > h1 > core-tooltip').attr("label", this.enemy_description);

		//Attack btns
		$(".select_attack > .attack_btns").html("");
		for (var i = 0; i < this.player_attacks.length; i++) {
			// console.log("Testing " + i + " (" + this.player_attacks[i] + ") and it is:");
			// console.log(data.attacks[this.player_attacks[i]]);
			$(".select_attack > .attack_btns").append(
				"<core-tooltip class='" + i + "' position='top'>"+
					"<paper-button raised onclick='fight_question(\""+ this.player_attacks[i]+ "\")'>" + this.player_attacks[i] + "</paper-button>"+
					"<div tip class='tip'>"+
					"</div>"+
				"</core-tooltip>"
			);
			var tt_self = false;
			var tt_other = false;
			var tt_dat = {}
			if (data.attacks[this.player_attacks[i]].hasOwnProperty("action-self")) {
				console.log("has self");
				tt_self = true;
				tt_dat.self_type = data.attacks[this.player_attacks[i]]["action-self"][0]
				tt_dat.self_val = data.attacks[this.player_attacks[i]]["action-self"][1]
				console.log("self_type: " + tt_dat.self_type);
				console.log("self_val: " + tt_dat.self_val);

			}
			if (data.attacks[this.player_attacks[i]].hasOwnProperty("action")) {
				tt_other = true;
				tt_dat.other_type = data.attacks[this.player_attacks[i]].action[0]
				tt_dat.other_val = data.attacks[this.player_attacks[i]].action[1]
			}
			fight_attack_tooltip(tt_self, tt_other, tt_dat, i)
		}

		this.check_health = function () {
			if (this.player_health <= 0) {
				swal({
					title: "You lost the Battle.",
					text: "Try again!",
					timer: 2999,
					type: "error"
				},
					function () {
						parse_story();
					}
				);
			} else if (this.enemy_health <= 0) {
				swal({
					title: "You won the Battle!",
					text: "You earn one level. Continue you journey.",
					timer: 2999,
					type: "success"
				},
					function () {
						localStorage.story_pos = parseInt(localStorage.story_pos) + 1;
						localStorage.lvl = parseInt(localStorage.lvl) + 1;
						parse_story();
						$(".fight_area").fadeOut("fast");
					});
			}
		};

		this.update_health();
	};
};

check_for_new_game = function() {
  if (localStorage.character === void 0 || localStorage.name === null) {
    $("#dialog_choose_name")[0].toggle();
    return console.log("toggling dialog");
  } else {
    return load_story();
  }
};

skip_tut = function() {
  if (parseInt(localStorage.story_pos) === 0 && localStorage.finished_tut === "true") {
    if (localStorage.storyline === "latin") {
      return localStorage.story_pos = 10;
    }
  }
};

parse_story = function() {
  console.log("running parse_story");
  if (parseInt(localStorage.story_pos) >= data.story.length) {
    $(".dialog").html("<paper-dialog backdrop autoCloseDisabled='true' heading='Which story do you want to play next?' class='paper-dialog-transition paper-dialog-transition-bottom' transition='paper-dialog-transition-bottom'> <h3>Choose one of the three. You will still learn the same language and have the same creature, but your level will be reset. You can also replay the story you just played. Or you can completely reset the game and choose another language to learn.</h3> <paper-button onclick=\"set_storyline('english');\" raised role='button' affirmative>English</paper-button> <paper-button onclick=\"set_storyline('latin');\" raised  role='button' affirmative>Latin</paper-button> <paper-button onclick=\"set_storyline('french');\" raised  role='button' affirmative>French</paper-button> <paper-button onclick=\"reset();\" raised role='button' affirmative>Reset</paper-button> </paper-dialog>");
    $(".dialog > paper-dialog")[0].toggle();
  }
  skip_tut();
  parse_story_element(data.story[parseInt(localStorage.story_pos)]);
  if (data.story[parseInt(localStorage.story_pos)].type !== "fight") {
    return localStorage.story_pos = parseInt(localStorage.story_pos) + 1;
  }
};

parse_story_element = function(element) {
  var __swal;
  console.log(element);
  if (element.type === "text") {
    notify(parse_inline_vars(element.value));
    return setTimeout(function() {
      return parse_story();
    }, 1000);
  } else if (element.type === "pop") {
    if (element.hasOwnProperty("title")) {
      return swal({
        text: parse_inline_vars(element.value),
        title: parse_inline_vars(element.title)
      }, function() {
        return setTimeout(function() {
          parse_story();
          return console.log("callback from swal");
        }, 250);
      });
    } else {
      return swal({
        title: parse_inline_vars(element.value)
      }, function() {
        return setTimeout(function() {
          parse_story();
          return console.log("callback from swal");
        }, 250);
      });
    }
  } else if (element.type === "advanced_pop") {
    __swal = element.swal;
    if (__swal.hasOwnProperty("title")) {
      __swal.title = parse_inline_vars(__swal.title);
    }
    if (__swal.hasOwnProperty("text")) {
      __swal.text = parse_inline_vars(__swal.text);
    }
    if (__swal.hasOwnProperty("confirmButtonText")) {
      __swal.confirmButtonText = parse_inline_vars(__swal.confirmButtonText);
    }
    if (__swal.hasOwnProperty("cancelButtonText")) {
      __swal.cancelButtonText = parse_inline_vars(__swal.cancelButtonText);
    }
    if (element.hasOwnProperty("callback")) {
      return swal(__swal, callbacks[element.callback]);
    } else {
      return swal(__swal, function() {
        return parse_story();
      });
    }
  } else if (element.type === 'fight') {
    return fight_start(element.enemy, parseInt(element.lvl));
  }
};

parse_inline_vars = function(input) {
  var i, __print, _i, _ref;
  __print = input.split("||");
  for (i = _i = 0, _ref = __print.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
    if (__print[i].toLowerCase() === "name") {
      __print[i] = localStorage.name;
    } else if (__print[i].toLowerCase() === "creature") {
      __print[i] = localStorage.character;
    }
  }
  return __print = __print.join("");
};

reset = function() {
  return swal({
    title: "Are you sure?",
    text: "All progress will be lost.",
    type: "warning",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    confirmButtonText: "Yes, reset the game!",
    cancelButtonText: "No, cancel please!"
  }, function(confirmed) {
    if (confirmed) {
      localStorage.clear();
      return location.reload();
    } else {
      return location.reload();
    }
  });
};

set_name = function() {
  console.log("Name set: " + ($("#dialog_choose_name > paper-input").val()));
  localStorage.name = $("#dialog_choose_name > paper-input").val();
  $("#dialog_choose_name").remove();
  $("#dialog_backstory").attr("heading", "Welcome to the Hugo Science Enrichment Center");
  $("#dialog_backstory").html("<p>HugoOS: We here at Hugo Science Enrichment Center are the leading scientists in terms of portals and time travel. You have been chosen to test our newest time machine protoype. You may never come back, so choose wisely if you want to go to ancient Rome, the England of Shakepeare or the french revolution.</p> <paper-button onclick='show_choose_creature()' affirmative autofocus role='button'>Got it</paper-button>");
  return $("#dialog_backstory")[0].toggle();
};

set_character = function(what) {
  localStorage.character = what;
  localStorage.lvl = 1;
  localStorage.finished_tut = false;
  localStorage.story_pos = 0;
  $("#dialog_choose_creature").remove();
  return $(".core-overlay-backdrop").remove();
};

set_storyline = function(which) {
  console.log("Running set_storyline");
  localStorage.story_pos = 0;
  localStorage.lvl = 1;
  localStorage.storyline = which;
  $(".core-overlay-backdrop").remove();
  return load_story();
};

show_choose_creature = function() {
  $("#dialog_backstory").remove();
  $("#dialog_choose_creature")[0].toggle();
  return notify("HugoOS: We here at Hugo Science Enrichment Center are the leading scientists in terms of portals and time travel. You have been chosen to test our newest time machine protoype. You may never come back, so choose wisely if you want to go to ancient Rome, the England of Shakepeare or the french revolution.");
};

notify = function(text) {
  $("#timeline_content").prepend("<p class='notification-element'>" + text + "</p>");
  $(".notification-element:nth-of-type(1)").css("display", "none");
  return $(".notification-element:nth-of-type(1)").fadeIn("fast");
};

pop = function(text, heading) {
  return $(".dialog").html('<paper-dialog heading="' + heading + '" opened="true" transition="paper-dialog-transition-bottom">' + text + '</paper-dialog>');
};

fight_start = function(enemy, enemy_lvl) {
  console.log("running fight_start");
  currentFight = new Fight(enemy, enemy_lvl);
  currentFight.set_display();
  return $(".fight_area").fadeIn("fast");
};

fight_question = function(attack_name) {
  console.log("running fight_question");
  currentQuestion.difficulty = data.attacks[attack_name].difficulty;
  currentQuestion.question = data.questions[currentQuestion.difficulty][random(0, data.questions[currentQuestion.difficulty].length)];
  if (currentQuestion.question.hasOwnProperty('right')) {
    $('.dialog').html('<paper-radio-group class="radio-gr"></paper-radio-group>');
  } else {
    $(".dialog").html("<paper-dialog backdrop heading='" + currentQuestion.question.question + "' class='paper-dialog-transition paper-dialog-transition-bottom' transition='paper-dialog-transition-bottom'> <h3>Answer this question to perform the attack!</h3> <paper-input autoclosedisabled label='enter your answer here'></paper-input> <paper-button onclick='fight_check_question(\"" + attack_name + "\")' autofocus role='button' affirmative>Attack!</paper-button> </paper-dialog>");
  }
  return $(".dialog > paper-dialog")[0].toggle();
};

fight_check_question = function(attack_name) {
  var i, __lower_array, _i, _ref;
  console.log("running fight_check_question");
  __lower_array = [];
  for (i = _i = 0, _ref = currentQuestion.question.answer.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
    __lower_array.push(currentQuestion.question.answer[i].toLowerCase());
  }
  try {
    $(".core-overlay-backdrop").remove();
  } catch (_error) {}
  if (localStorage.cheatMode === "Boss" || localStorage.character === 'Ben-Cheat') {
    fight_attack(attack_name);
    currentFight.switch_turn();
    return;
  }
  if ($(".dialog > paper-dialog > paper-input").val().toLowerCase() === currentQuestion.question.answer.toLowerCase()) {
    fight_attack(attack_name);
    return currentFight.switch_turn();
  } else if ($.inArray($(".dialog > paper-dialog > paper-input").val().toLowerCase(), __lower_array) !== -1) {
    fight_attack(attack_name);
    return currentFight.switch_turn();
  } else {
    notify("<span style='color: #E53935;'>Wrong answer! Your attack failed!<span>");
    return setTimeout(function() {
      return currentFight.switch_turn();
    }, 500);
  }
};

fight_enemy_attack = function() {
  var __attack, __random;
  console.log("running fight_enemy_attack");
  __random = random(0, currentFight.enemy_attacks.length);
  __attack = currentFight.enemy_attacks[__random];
  console.log("" + __attack + " (" + __random + ")");
  fight_attack(__attack);
  return currentFight.switch_turn();
};

fight_attack = function(attack_name) {
  currAttack = data.attacks[attack_name];
  fight_change_vals(currAttack.action, currentFight.turn, currentFight.victim);
  if (currAttack.hasOwnProperty("action-self")) {
    fight_change_vals(currAttack['action-self'], currentFight.victim, currentFight.turn);
  }
  if (currentFight.turn === 'player') {
    notify(fight_parse_inline_vars(currAttack.text));
  } else if (currentFight.turn === 'enemy') {
    swal(fight_parse_inline_vars(currAttack.text));
    notify(fight_parse_inline_vars(currAttack.text));
  } else {
    console.log("No fight has been start yet or currentFight.turn is wrong: " + currentFight.turn);
  }
  return currentFight.check_health();
};

fight_change_vals = function(action, attacker, victim) {
  console.log("running fight_change_vals");
  if (currAttack.action[0] === 'hp') {
    currentFight[victim + '_health'] += Math.round(parseInt(action[1]) * currentFight[attacker + '_attack_multiplier'] * currentFight[victim + '_defense_multiplier'] * currentFight[attacker + '_lvl'] / 33);
    return currentFight.update_health();
  } else if (currAttack.action[0] === 'attack') {
    return currentFight[victim + "_attack_multiplier"] += action[1];
  } else if (currAttack.action[0] === 'defense') {
    return currentFight[victim + "_attack_multiplier"] += action[1];
  } else {
    console.log("++++++++++ERROR++++++++++");
    console.log("There's an error with the action[0]. currAttack is:");
    console.log(currAttack);
    console.log("action[0] is:");
    console.log(currAttack.action[0]);
    return console.log("++++++++++ERROR++++++++++");
  }
};

fight_attack_tooltip = function(self, other, dat, i) {
  var result;
  result = "";
  if (other && parseFloat(dat.other_val) !== 0 && parseFloat(dat.other_val) > 0 && dat.other_type.toLowerCase() === 'hp') {
    result += '<p><b>Enemy: </b>' + dat.other_type.toUpperCase() + ' +' + Math.round(dat.other_val * currentFight.player_attack_multiplier * currentFight.enemy_defense_multiplier * currentFight.player_lvl / 33) + '</p>';
  } else if (other && parseFloat(dat.other_val) !== 0 && parseFloat(dat.other_val) < 0 && dat.other_type.toLowerCase() === 'hp') {
    result += '<p><b>Enemy: </b>' + dat.other_type.toUpperCase() + ' ' + Math.round(dat.other_val * currentFight.player_attack_multiplier * currentFight.enemy_defense_multiplier * currentFight.player_lvl / 33) + '</p>';
  } else if (other && parseFloat(dat.other_val) !== 0 && parseFloat(dat.other_val) > 0 && dat.other_type.toLowerCase() === 'attack') {
    result += '<p><b>Enemy: </b>' + dat.other_type.toUpperCase() + ' +' + dat.other_val * 100 + '%</p>';
  } else if (other && parseFloat(dat.other_val) !== 0 && parseFloat(dat.other_val) < 0 && dat.other_type.toLowerCase() === 'attack') {
    result += '<p><b>Enemy: </b>' + dat.other_type.toUpperCase() + ' ' + dat.other_val * 100 + '%</p>';
  } else if (other && parseFloat(dat.other_val) !== 0 && parseFloat(dat.other_val) < 0 && dat.other_type.toLowerCase() === 'defense') {
    result += '<p><b>Enemy: </b>' + dat.other_type.toUpperCase() + ' +' + dat.other_val * (-100) + '%</p>';
  } else if (other && parseFloat(dat.other_val) !== 0 && parseFloat(dat.other_val) > 0 && dat.other_type.toLowerCase() === 'defense') {
    result += '<p><b>Enemy: </b>' + dat.other_type.toUpperCase() + ' ' + dat.other_val * (-100) + '%</p>';
  }
  console.log(self);
  console.log(dat.self_type);
  console.log(dat.self_val);
  if (self && parseFloat(dat.self_val) !== 0 && parseFloat(dat.self_val) > 0 && dat.self_type.toLowerCase() === 'hp') {
    result += '<p><b>You: </b>' + dat.self_type.toUpperCase() + ' +' + Math.round(dat.self_val * currentFight.player_attack_multiplier * currentFight.enemy_defense_multiplier * currentFight.player_lvl / 33) + '</p>';
  } else if (self && parseFloat(dat.self_val) !== 0 && parseFloat(dat.self_val) < 0 && dat.self_type.toLowerCase() === 'hp') {
    result += '<p><b>You: </b>' + dat.self_type.toUpperCase() + ' ' + Math.round(dat.self_val * currentFight.player_attack_multiplier * currentFight.enemy_defense_multiplier * currentFight.player_lvl / 33) + '</p>';
  } else if (self && parseFloat(dat.self_val) !== 0 && parseFloat(dat.self_val) > 0 && dat.self_type.toLowerCase() === 'attack') {
    result += '<p><b>You: </b>' + dat.self_type.toUpperCase() + ' +' + dat.self_val * 100 + '%</p>';
  } else if (self && parseFloat(dat.self_val) !== 0 && parseFloat(dat.self_val) < 0 && dat.self_type.toLowerCase() === 'attack') {
    result += '<p><b>You: </b>' + dat.self_type.toUpperCase() + ' ' + dat.self_val * 100 + '%</p>';
  } else if (self && parseFloat(dat.self_val) !== 0 && parseFloat(dat.self_val) > 0 && dat.self_type.toLowerCase() === 'defense') {
    result += '<p><b>You: </b>' + dat.self_type.toUpperCase() + ' ' + dat.self_val * (-100) + '%</p>';
  } else if (self && parseFloat(dat.self_val) !== 0 && parseFloat(dat.self_val) < 0 && dat.self_type.toLowerCase() === 'defense') {
    result += '<p><b>You: </b>' + dat.self_type.toUpperCase() + ' +' + dat.self_val * (-100) + '%</p>';
  }
  if (result === '') {
    result = 'Nothing happens';
  }
  return $('.select_attack > .attack_btns > .' + i + ' > .tip').html(result);
};

fight_parse_inline_vars = function(text) {
  var i, __attacker, __res, __victim, _i, _ref;
  console.log("running fight_parse_inline_vars");
  __attacker = currentFight.character;
  __victim = currentFight.enemy;
  if (currentFight.turn === 'enemy') {
    __attacker = currentFight.enemy;
    __victim = currentFight.character;
  }
  __res = text.split("||");
  for (i = _i = 0, _ref = __res.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
    if (__res[i].toLowerCase() === 'creature') {
      __res[i] = __attacker;
    } else if (__res[i].toLowerCase() === 'enemy') {
      __res[i] = __victim;
    }
  }
  return __res = __res.join("");
};

init = function() {
  return check_for_new_game();
};
