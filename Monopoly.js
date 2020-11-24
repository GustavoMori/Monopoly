function Player (name, Ai) {
  this.name = name;
  this.coins = 300;
  this.alive = true;
  this.position = 0;
  this.currentRound = 0;

  this.Behavior = new Ai();

  this.ReceiveTourMoney = ReceiveTourMoney;

  function ReceiveTourMoney () {
    const tour = 100
    return (
      this.coins += tour
    )
  }
}

function ImpulsivePlayer () {
  this.WishHouse = WishHouse; 

  function WishHouse (player, house) {
    return player.coins > house.price
  }
}

function DemandingPlayer () {
  this.WishHouse = WishHouse;

  function WishHouse (player, house) {
    return house.rent > 50
  }
}

function CautiousPlayer () {
  this.WishHouse = WishHouse;

  function WishHouse (player, house) {
    return player.coins - house.price >= 80 
  }
}

function RandomPlayer () {
  this.WishHouse = WishHouse;

  function WishHouse (player, house) {
    return rollDie() > 3
  }
}

function Game () {
  this.HandlePlayerBuyHouse = HandlePlayerBuyHouse;
  this.PlayRound = PlayRound;
  this.PayRent = PayRent;

  function HandlePlayerBuyHouse (player, house) {
    if (player.position === house.position && player.coins >= house.price) {
      player.coins = player.coins - house.price
      house.owner = player
    }
  }

  function PayRent (player, house, houses) {
    if (player != house.owner ) {
      const transfer = player.coins >= house.rent ? house.rent : player.coins
      player.coins = player.coins - transfer
      house.owner.coins = house.owner.coins + transfer
      if (transfer < house.rent) {
        player.alive = false;
        houses.filter(house => house.owner == player).forEach( house => {
          house.owner = null
        })
      }
    }
  }

  function PlayRound (board, match) {
    match.playersOrder.forEach( (player) => {
      if (player.alive) {
        Move(player)
        if (player.position != 0)  {
          const house = board.houses.find(house => house.position === player.position)
          if (house.owner != null) {
            PayRent(player, house, board.houses)
          }
          else {
            if (player.Behavior.WishHouse(player, house)) {
              HandlePlayerBuyHouse(player, house)
            }
          }
        }
        player.currentRound++
      }
    })
    match.round++
    return !!(match.playersOrder.filter( (player) => player.alive).length > 1 && match.round < 1000)
  }
}


function Match () {
  this.round = 0;

  this.playersOrder = RandomSortPlayers(CreatePlayers());

  function CreatePlayers () {
    const player1 = new Player('Impulsivo', ImpulsivePlayer); 
    const player2 = new Player('Exigente', DemandingPlayer);
    const player3 = new Player('Cauteloso', CautiousPlayer);
    const player4 = new Player('Aleatório', RandomPlayer);
    const arrayPlayers = [player1, player2, player3, player4];

    return arrayPlayers;
  }

  function RandomSortPlayers (inputArrayPlayers) {

    let arrayPlayers = [...inputArrayPlayers]
    let currentIndex = arrayPlayers.length,
    temporaryValue,
    randomIndex;

    while (0 !== currentIndex) {
  
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      temporaryValue = arrayPlayers[currentIndex];
      arrayPlayers[currentIndex] = arrayPlayers[randomIndex];
      arrayPlayers[randomIndex] = temporaryValue;
    }
    return arrayPlayers;
  }
}

const fs = require('fs')

function Board () {
  this.houses = [];

  try {
    const configData = fs.readFileSync('./gameConfig.txt', 'utf8')
    const rows = configData.split("\n")
    const houses = rows.map( (e, position) => {
      const [price, _, rent] = e.split(/(\s){1,2}/)
      const house = new House(Number(price), Number(rent), null, position + 1)
      return house;
    })
    this.houses = houses
  } catch (err) {
    console.error(err)
  }
}

function House (price, rent, owner, position) {
  this.price = price;
  this.rent = rent;
  this.owner = owner;
  this.position = position;
}

function rollDie () {
  const numberDice = Math.floor(Math.random() * 6) + 1;
  return numberDice;
}

function Move (player) {
  const die = rollDie();
  player.position += die 
  if (player.position > 20) {
    player.position = player.position - 21
    player.ReceiveTourMoney()
  }
}

function MatchResult (players) {
  this.players = players.map( (player) => ({
    name: player.name,
    coins: player.coins,
    roundsPlayed: player.currentRound,
    alive: player.alive,
  }));
  const winners = this.players.filter( (player) => player.coins == Math.max(... this.players.map( (player)  => player.coins )));
  this.winner = winners[0] 
  this.rounds = Math.max(... this.players.map( (player) => player.roundsPlayed));
}

function Controller (count) {
  this.results = [];

  for (let i = 0; i < count; i++ ) {
    RunMatch(this.results)
  };
  
  function RunMatch (results) {    
    const board = new Board();
    const game = new Game();
    const match = new Match();
    let gameAlive = true;
    while (gameAlive) {
      gameAlive = game.PlayRound(board, match)
    }
    const result = new MatchResult(match.playersOrder)
    results.push(result)
  }
}

const gamesPlayed = 1000000;

const controller = new Controller(gamesPlayed)
let winsImpulsivo = 0;
let winsCauteloso = 0;
let winsExigente = 0;
let winsAleatorio = 0;
let sumRounds = 0;
let timeout = 0

controller.results.forEach( (result) => {
  switch (result.winner.name){
    case 'Impulsivo': {
      winsImpulsivo++
      break
    }

    case 'Cauteloso': {
      winsCauteloso++
      break;
    }
    
    case 'Exigente': {
      winsExigente++
      break;
    }

    case 'Aleatório': {
      winsAleatorio++
      break;
    }
  }
  sumRounds += result.rounds
  if (result.rounds === 1000){
    timeout++
  }
})

let avgRounds = sumRounds/gamesPlayed

let winsPerPlayer = [
  {name: 'Impulsivo', wins: winsImpulsivo},
  {name: 'Cauteloso', wins: winsCauteloso},
  {name: 'Exigente', wins: winsExigente},
  {name: 'Aleatorio', wins: winsAleatorio},
]

const max = winsPerPlayer.reduce((prev, current) => {
  return (prev.wins > current.wins) ? prev : current
}) //returns object
console.log('wins: ', {
  Impulsivo: winsImpulsivo,
  Cauteloso: winsCauteloso,
  Exigente: winsExigente,
  Aleatorio: winsAleatorio,
})

console.log('winrate (%): ', {
  Impulsivo: winsImpulsivo/gamesPlayed * 100,
  Cauteloso: winsCauteloso/gamesPlayed * 100,
  Exigente: winsExigente/gamesPlayed * 100,
  Aleatorio: winsAleatorio/gamesPlayed * 100,
})

console.log('Média de rounds por partida:', avgRounds)
console.log('O numero de partidas que terminaram por timeout foram de: ', timeout)
console.log('O comportamento que mais venceu: ', max.name)