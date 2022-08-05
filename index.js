console.log("Kerwin's Wallet");

// Require Modules
const bcash = require("bcash");
const axios = require("axios");
const ecashaddr = require("ecashaddrjs");


// Generate mnemonic phrase
const mnemonicOptions = { 
    language: "english",
    phrase: "comic grocery truth shallow explain anger matrix where axis sunset hub nasty" 
};

const mnemonic = new bcash.Mnemonic(mnemonicOptions);

// console.log("mnemonic", mnemonic.getPhrase());

const phraseString = mnemonic.getPhrase();
// console.log(phraseString);

//Convertd String to Array
let phraseArray = phraseString.split(' ');
// console.log(phraseArray);



//Converted Array back to String
const toString = phraseArray.join(" ");

//Loop through elements in array
const ourJoin = function(arrayToJoin, separator = " "){
    let finalString = "";
    for(let i = 0; i < arrayToJoin.length; i++){
        const word = arrayToJoin[i];
        if(i > 0){
            finalString = finalString + separator;
        }
        finalString = finalString + word;
        // console.log("finalString",finalString);
    }

    return finalString;
}
// console.log("ourJoin()", ourJoin(phraseArray));
// let phraseStringTwo = phraseArray.toString().replaceAll(','," ");
// console.log(phraseStringTwo);
// console.log("phraseArray", phraseArray);
// console.log("toString", toString);


// Step 1 of BMS 2 HW

//1. Create master HDPrivateKey using the fromMnemonic() method located at https://github.com/badger-cash/bcash/blob/master/lib/hd/hd.js#L58 . 

//Got the specific toolbox, module for replicator / Defined HD

 const HD = require("bcash");

 //Copy paste fromMnemonic() method

 HD.fromMnemonic = function fromMnemonic(mnemonic) {
    return HDPrivateKey.fromMnemonic(mnemonic);
  };
  
  //From toolbox, I am using the fromMnemonic tool from the bcash.hd toolbox/module 
  //Pass mnemonic object as an argument/choose mnemonic type for style of fromMnemonic tool
  const master = bcash.hd.fromMnemonic(mnemonic);

  


//Step 2 of BMS 2 HW

  //Initialize the variable hdkey
  const hdkey = master.derivePath("m/44'/899'/0'");
  
//Step 3 of BMS 2 HW

  //run the xpubkey() method on "hdkey"./ Use xpub tool from hdkey toolbox/module
  const step3 = hdkey.xpubkey()

  
//Bonus :  

  //Derive child key from hdkey and assign it to the variable "child"./Use derive tool from hdkey toolbox to create a child
  //hdkey.derive(hdkey.privateKey)
  const receiving = hdkey.derive(0);
  const firstKey = receiving.derive(0)
  // console.log("firstKey", firstKey)
  const firstKeyRing = bcash.KeyRing.fromPrivate(firstKey.privateKey)
  // console.log("firstKeyRing", firstKeyRing)
  const firstAddress = firstKeyRing.getAddress().toString();
  

  //Make an array of keyRings
  const keyringArray = [];
  for (let i = 0; i < 20; i++){
    const key = receiving.derive(i)
    const keyRing = bcash.KeyRing.fromPrivate(key.privateKey);
    keyringArray.push(keyRing);
  }

  const {type, hash} = ecashaddr.decode(firstAddress); //destructuring
  const firstEcashAddress = ecashaddr.encode("ecash", type, hash);

  const addressArray = keyringArray.map(keyring => {
    const address = keyring.getAddress().toString();
    const {type, hash} = ecashaddr.decode(address); //destructuring
    const ecashAddress = ecashaddr.encode("ecash", type, hash);
    return ecashAddress;
  });

  // console.log("keyringArray.length",keyringArray.length);
  // console.log("firstAddress",firstAddress);
  // console.log("firstEcashAddress",firstEcashAddress);
  console.log("addressArray",addressArray);
  //Then do a console log of the privateKey property of "child."
  // console.log("child.privateKey",child.privateKey);

  //HW 4
  //Define the variable "firstAddr" and assign it to the first address string in addressArray
  const firstAddr = addressArray[0];
  console.log("firstAddr",firstAddr);
  

  //Use axios to create a GET call to the following address https://ecash.badger.cash:8332/coin/address/YOUR_ADDRESS (where YOUR ADDRESS is firstAddr. 
  //This will require you constructing the full url string before you pass it to axios.get() as an argument
  
  const url = 'https://ecash.badger.cash:8332/coin/address/' + firstAddr;

  // axios.get(url).then(resp =>{

  //     console.log(resp.data);
  // });
  // console.log("url",url);

  
  // console.log(url);
  // axios.get("url",url);

  ( async () => {
      try {
        //Fetch UTXOs
        const result = await axios.get(url);
        const utxoArray = result.data
        //Create coin object from first UTXO
        const firstCoin = bcash.Coin.fromJSON(utxoArray[0]);

        //Create Tx
        const tx = new bcash.MTX();
        
        //Add output
        // Second address, 700 satoshis
        tx.addOutput(keyringArray[1].getAddress(), 700);

        // Fund transaction
        await tx.fund([firstCoin], {
            changeAddress: keyringArray[0].getAddress(),
            rate: 1000 //satoshis per 1000 bytes
        });

        tx.sign(keyringArray);

        const hex = tx.toRaw().toString("hex");

        const broadcast = await axios.post('https://ecash.badger.cash:8332/broadcast', {
            tx: hex
        });

        console.log("broadcast.data",broadcast.data);
      } catch (err) {
        console.error(err);
      }
  })();
  
