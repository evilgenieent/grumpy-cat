// Generated by CoffeeScript 1.8.0
var callbacks, check_for_new_game, cookies, currentFight, data, data_, fight_attack, fight_start, get_JSON, init, load_attacks, load_cookies, load_creatures, load_story, notify, parse_inline_vars, parse_story, parse_story_element, pop, read_cookie, set_character, set_cookie, set_name, set_storyline, show_choose_creature, skip_tut;

cookies = {};

data = {};

data_ = {};

callbacks = {};

currentFight = 'noFightRunning';

get_JSON = function(what, where) {
  data_ = void 0;
  return $.getJSON("assets/data/" + what + ".json", function(json) {
    data_ = json;
    return data[where] = data_;
  });
};

read_cookie = function(key) {
  var result;
  result = void 0;
  result = void 0;
  if (result = new RegExp("(?:^|; )" + encodeURIComponent(key) + "=([^;]*)").exec(document.cookie)) {
    return result[1];
  } else {
    return void 0;
  }
};

set_cookie = function(cookieName, cookieValue) {
  var expire;
  expire = void 0;
  expire = new Date(1000000000000000);
  document.cookie = cookieName + "=" + cookieValue + ";expires=" + expire.toGMTString();
  return load_cookies();
};

load_cookies = function() {
  var key, __to_load, _i, _len;
  __to_load = ["name", "character", "finished_tut", "lvl", "storyline", "story_pos"];
  for (_i = 0, _len = __to_load.length; _i < _len; _i++) {
    key = __to_load[_i];
    cookies[key] = read_cookie(key);
  }
  cookies.story_pos = parseInt(cookies.story_pos);
  if (cookies.finished_tut === "true") {
    return cookies.finished_tut = true;
  } else if (cookies.finished_tut === "false") {
    return cookies.finished_tut = false;
  }
};

load_story = function() {
  return $.getJSON("assets/data/" + cookies.storyline + "-story.json", function(json) {
    data.story = json;
    return load_attacks();
  });
};

load_attacks = function() {
  return $.getJSON("assets/data/attacks.json", function(json) {
    data.attacks = json;
    return load_creatures();
  });
};

load_creatures = function() {
  return $.getJSON("assets/data/creatures.json", function(json) {
    data.creatures = json;
    return parse_story();
  });
};

callbacks = {
  log_hey: function() {
    return console.log("Hey");
  }
};

function Fight (enemy, enemy_lvl) {
  this.character = cookies.character;
  this.player_lvl = parseInt(cookies.lvl);
  this.enemy = enemy;
  this.enemy_lvl = enemy_lvl;

  //Keeps track of health
  this.player_health = Math.round(parseInt(data.creatures[this.character].basestats.hp) * parseInt(cookies.lvl) / 33);
  this.enemy_health = Math.round(parseInt(data.creatures[this.enemy].basestats.hp) * parseInt(enemy_lvl) / 33);

  //Keeps track type
  this.player_type = data.creatures[this.character].basestats.type;
  this.enemy_type = data.creatures[this.enemy].basestats.type;

  this.update_health = function () {
    $(".fight_area > .creatures > .player > paper-progress").attr("value", Math.round(this.player_health / (parseInt(data.creatures[this.character].basestats.hp * parseInt(cookies.lvl) / 33) * 100)));
    $(".fight_area > .creatures > .enemy > paper-progress").attr("value", Math.round(this.enemy_health / (parseInt(data.creatures[this.enemy].basestats.hp * parseInt(cookies.lvl) / 33) * 100)));
  };

  this.set_display = function () {
    //setting h1 with names and lvl of creatures
    $('.fight_area > .creatures > .player > h1 > span.name').html(this.character);
    $('.fight_area > .creatures > .enemy > h1 > span.name').html(this.enemy);
    $('.fight_area > .creatures > .player > h1 > span.lvl > span').html(this.player_lvl);
    $('.fight_area > .creatures > .enemy > h1 > span.lvl > span').html(this.enemy_lvl);

    this.update_health();
  };
};

fight_start = function(enemy, enemy_lvl) {
  currentFight = new Fight(enemy, enemy_lvl);
  return currentFight.set_display();
};

fight_attack = function(attack_name) {
  return console.log(data[attack_name]);
};

$("#dialog_choose_name").on("change", function() {
  return set_name();
});

check_for_new_game = function() {
  if (cookies.character === void 0 || cookies.name === null) {
    $("#dialog_choose_name").toggle();
    return console.log("toggling dialog");
  } else {
    return load_story();
  }
};

skip_tut = function() {
  if (cookies.story_pos === 0 && cookies.finished_tut) {
    if (cookies.storyline === "latin") {
      return cookies.story_pos = 10;
    }
  }
};

parse_story = function() {
  skip_tut();
  parse_story_element(data.story[cookies.story_pos]);
  set_cookie("story_pos", cookies.story_pos + 1);
  return load_cookies();
};

parse_story_element = function(element) {
  var __swal;
  console.log(element);
  if (element.type === "text") {
    notify(parse_inline_vars(element.value));
    return setTimeout(function() {
      return parse_story();
    }, 2000);
  } else if (element.type === "pop") {
    if (element.hasOwnProperty("title")) {
      return swal({
        text: parse_inline_vars(element.value),
        title: parse_inline_vars(element.title)
      }, function() {
        return setTimeout(function() {
          parse_story();
          return console.log("callback from swal");
        }, 1000);
      });
    } else {
      return swal({
        title: parse_inline_vars(element.value)
      }, function() {
        return setTimeout(function() {
          parse_story();
          return console.log("callback from swal");
        }, 1000);
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
  }
};

parse_inline_vars = function(input) {
  var i, __print, _i, _ref;
  __print = input.split("||");
  for (i = _i = 0, _ref = __print.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
    if (__print[i].toLowerCase() === "name") {
      __print[i] = cookies.name;
    } else if (__print[i].toLowerCase() === "creature") {
      __print[i] = cookies.character;
    }
  }
  return __print = __print.join("");
};

set_name = function() {
  console.log("Name set: " + ($("#dialog_choose_name > paper-input").val()));
  set_cookie("name", $("#dialog_choose_name > paper-input").val());
  load_cookies();
  $("#dialog_choose_name").remove();
  $("#dialog_backstory").attr("heading", "Welcome to the Hugo Science Enrichment Center");
  $("#dialog_backstory").html("<p>HugoOS: We here at Hugo Science Enrichment Center are the leading scientists in terms of portals and time travel. You have been chosen to test our newest time machine protoype. You may never come back, so choose wisely if you want to go to ancient Rome, the England of Shakepeare or the french revolution.</p> <paper-button onclick='show_choose_creature()' affirmative autofocus role='button'>Got it</paper-button>");
  return $("#dialog_backstory").toggle();
};

set_character = function(what) {
  set_cookie("character", what);
  set_cookie("lvl", 1);
  set_cookie("finished_tut", false);
  set_cookie("story_pos", 0);
  load_cookies();
  return $("#dialog_choose_creature").remove();
};

set_storyline = function(which) {
  set_cookie("storyline", which);
  load_cookies();
  return load_story();
};

show_choose_creature = function() {
  $("#dialog_backstory").remove();
  $("#dialog_choose_creature").toggle();
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

init = function() {
  load_cookies();
  check_for_new_game();
  return $(".select_attack").css("position", "absolute");
};

document.addEventListener("polymer-ready", function() {
  var drawerPanel, navicon;
  navicon = document.getElementById("navicon");
  drawerPanel = document.getElementById("drawerPanel");
  navicon.addEventListener("click", function() {
    drawerPanel.togglePanel();
  });
  init();
});
