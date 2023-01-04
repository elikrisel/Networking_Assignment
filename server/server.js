const http = require('http');
const fs = require('fs');
const path = require('path');

let positions = {elikrisel: {x: 0, y: 0, z: 0},
                 robin: {x: -4, y: 0, z: 0}};

function v3add(v1, v2) {
  return {x: v1.x + v2.x,
          y: v1.y + v2.y,
          z: v1.z + v2.z};
}

function charactersToButtons() {
  return "<select multiple onChange='selected_character = this.options[this.selectedIndex].value'>" +
          Object.keys(positions).map(name => 
    `<option>${name}</option>`
).join("\n")
         + "</select>";
}

function adminPage() {
return (
`
<!-- <meta http-equiv="refresh" content="0.1"> -->
<script>
function get_pos(character) {
  if (!character) {
    console.error("no character selected");
    return;
  }
  fetch("http://127.0.0.1:8125/position/" + character,
        {method: 'GET'})
  .then(res => res.json())
  .then(res => { console.log(character,"position:",res);
                 positions[character] = res; });
}
async function move(character, dir) {
  if (!character) {
    console.error("no character selected");
    return;
  }
 
  fetch("http://127.0.0.1:8125/set-position/" + character, 
        {method: 'POST', body: JSON.stringify({direction: dir,
        current_pos: positions[character]})})
        .then(() => get_pos(character));
}
var selected_character = null;
var positions = {};
</script>
<p>Characters</p>
${charactersToButtons()}
<button onClick="get_pos(selected_character)">Get Position</button>
<table>
  <tr>
    <td>
    &nbsp;
    </td>
    <td>
    <button onClick="move(selected_character, {x: 0, y: 1, z: 0})">/\\</button>
    </td>
  </tr>
  <tr>
    <td>
    <button onClick="move(selected_character, {x: -1, y: 0, z: 0})"><</button>
    </td>
    <td>
    <button onClick="move(selected_character, {x: 0, y: -1, z: 0})">\\/</button>
    </td>
    <td>
    <button onClick="move(selected_character, {x: 1, y: 0, z: 0})">></button>
    </td>
  </tr>
</table>
`);
}

// turns a vector into something like {x: 1, y: 0, z: 0}
function v3_4way(v) {
  if (v.x !== 0) {

    return {x: v.x / Math.abs(v.x),
            y: 0,
            z: 0};

  } 
  
  else if (v.y !== 0) {
    return {x: 0,
            y: v.y / Math.abs(v.y),
            z: 0};
  } else {
    return {x: 0,
            y: 0,
            z: 0};
  }
}

function v3eq(v1, v2) {
  return v1.x == v2.x && v1.y == v2.y && v1.z == v2.z;
}

/// √((x_2-x_1)²+(y_2-y_1)²)

function v3_Dis(v1,v2){

  
  return Math.sqrt((v2.x - v1.x) ** 2) + ((v2.y - v1.y) ** 2);


}


function responseFunc(request, response) {
  //console.log("got request:", request.url);
  let parts = request.url
    .split("/")
    .filter(x => x !== '');

  //console.log(parts);

  switch (parts[0]) {
    case 'position':
      let username = parts[1];
      //console.log("username: ", username);
      //console.log("moving to: ", positions[username]);


      setTimeout(() => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(positions[username]), 'utf-8');
      }, 300);
      break;
    case 'set-position':
      let data = '';

      request.on('data', chunk => {
        data += chunk;
      });

      request.on('end', () => {
        let username = parts[1];
        let movement = JSON.parse(decodeURIComponent(data));
        
        //console.log(movement);

        movement.direction = v3_4way(movement.direction);
        
        setTimeout(() => {
          
          console.log(v3_Dis(movement.current_pos,positions[username]));
          console.log(movement.current_pos);
          console.log(positions[username]);

          
          if (v3eq(movement.current_pos, positions[username])) {
            positions[username] = v3add(positions[username], movement.direction);
          }
          
          //console.log("moving to: ", movement.direction);
          //console.log("user", username, "got new pos", positions[username]);
          response.writeHead(200);
          response.end("nice");
        }, 300);
      });
      break;
    case 'admin':
      response.writeHead(200, {'Content-Type': 'text/html' });
      response.end(adminPage(), 'utf-8');
      break;
    default:
        response.writeHead(404);
        response.end(`Your request ${request.url} did not match any operations.`, 'utf-8');
  }
}



let server = http.createServer(responseFunc);

server.listen(8125);

console.log('Server running a "server": http://127.0.0.1:8125/');

