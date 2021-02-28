const Discord = require('discord-module');
const Message = require('discord-module/classes/Message');
const fs = require('fs');
let lastQuote = {};

const discord = new Discord({
  token: require('./token'),
});

const getMessages = () => JSON.parse(fs.readFileSync('data.json'));

/**
 * @param {Array<String>} args 
 * @param {Function} reply 
 */
const listMessages = (args, reply) => {
  const page = parseInt(args[0] || 1) - 1;
  const pages = [];
  const messages = getMessages();
  let string = '';

  const generatePage = ([name, words]) => {
    let currentKey = `${ name }:\n`;

    words.forEach((word, index) => {
      currentKey += `  [${ index + 1 }] - ${ word.split(' ').map((a) => a.match(/https:\/\//) ? `<${ a }>` : a).join(' ') }\n`;
    });

    currentKey += '\n';

    if (string.length && string.length + currentKey.length > 2000) {
      pages.push(string);
      string = '';
    }

    string += currentKey;
  };

  if (isNaN(page)) {
    if (messages[args[0]]) {
      generatePage([args[0], messages[args[0]]]);
    } else {
      reply(`Jimmy ist unterwegs um "${args[0]}" zu finden, aber bis jetzt hat er nur seine Guitarre und das Meer.`);
      return;
    }
  } else {
    Object.entries(messages).forEach(generatePage);
  }

  pages.push(string);

  reply(pages[page || 0] || 'Jimmy konnte diese Seite nicht finden.');
};


/**
 * 
 * @param {Array<String>} _ 
 * @param {Function} reply
 * @param {Array<mixed>} ___
 * @param {Message} message
 */
const ping = (_, reply, ___, message) => {
  reply(new Date().getTime() - message.time.getTime() + 'ms');
};

/**
 * 
 * @param {Array<String>} args 
 * @param {Function} reply
 * @param {Array<mixed>} attachments
 */
const addMessage = (args, reply, attachments) => {
  if (!args[1] && !attachments.length) {
    reply('Jimmi braucht ganze Befehle')
    return;
  }

  const word = args.shift().toLocaleLowerCase();
  const messages = getMessages();

  if (!messages[word]) {
    messages[word] = [];
  }


  if (!attachments.length) {
    messages[word].push(args.join(' '));
  } else {
    attachments.forEach((attachment) => {
      messages[word].push(attachment.url);
    });
  }

  fs.writeFileSync('data.json', JSON.stringify(messages, null, 2));

  if (attachments.length) {
    if (attachments.length - 1) {
      reply(`Danke dir. Jimmy Braun wird sich über die ${attachments.length} Bilder freuen.`);
    } else {
      reply(`Danke dir. Jimmy Braun wird sich über das Bild freuen.`);
    }
  } else {
    reply('Danke dir. Jimmy Braun wird sich freuen.');
  }

};

/**
 * 
 * @param {Array<String>} args 
 * @param {Function} reply 
 */
const editMessage = (args, reply) => {
  if (!args[2]) {
    reply('Jimmi braucht ganze Befehle')
    return;
  }

  const messages = getMessages();
  const word = args.shift().toLocaleLowerCase();
  const index = parseInt(args.shift()) - 1;

  if (messages[word]) {
    messages[word][index] = args.join(' ');
  } else {
    reply(`Jimmy sucht schon sehr lange nach "${word}", aber hat es bis jetzt noch nicht finden können.`);
    return;
  }

  fs.writeFileSync('data.json', JSON.stringify(messages, null, 2));
  reply('Ich werde Jimmy direkt informieren.');
};

/**
 * 
 * @param {Array<String>} args 
 * @param {Function} reply 
 */
const deleteMessage = (args, reply) => {
  if (!args[1]) {
    reply('Jimmi braucht ganze Befehle')
    return;
  }

  const messages = getMessages();
  const word = args.shift().toLocaleLowerCase();
  const index = parseInt(args.shift()) - 1;

  if (messages[word]) {
    messages[word].splice(index, 1);
  } else {
    reply('Nichtmal Jimmy kann etwas löschen, was nicht existiert.');
    return;
  }

  if (!messages[word].length) {
    delete messages[word];
  }

  fs.writeFileSync('data.json', JSON.stringify(messages, null, 2));
  reply('Das war Jimmy schon die ganze Zeit ein Dorn im Auge.');
};

const commands = {
  list: listMessages,
  add: addMessage,
  edit: editMessage,
  delete: deleteMessage,
  ping,
};

/**
 * @param {Message} message
 * @param {Function} reply 
 */
discord.onmessage = (message, reply) => {
  const { content, attachments } = message;

  if (message.author.id === discord.getUser().id) {
    return;
  }

  if (content.startsWith('*heaven')) {
    const args = content.split(/\s/gm);
    delete args.shift();
    const command = args.shift();

    if (commands[command]) {
      commands[command](args, reply, attachments, message);
    } else {
      reply('Es tut mir Leid, aber Jimmy Braun hat diesen Befehl noch nicht hinzugefügt.');
    }
  } else {
    const messages = getMessages();
    let answered = false;

    if (!content.length) {
      return;
    }

    content.split(/\s/gm).map((a) => a.toLowerCase()).forEach((word) => {
      Object.entries(messages).forEach(([name, value]) => {
        if (answered) {
          return;
        }

        if (name.match(word)) {
          let number;
          let tries = 0;

          do {
            number = Math.floor(Math.random() * value.length);
            tries++;
          } while (number === lastQuote[word] && tries < 100);

          lastQuote[word] = number;

          reply(value[number])
          answered = true;
        }
      });
    })
  }
};