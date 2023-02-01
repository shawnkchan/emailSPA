
window.onpopstate = function(event) {
  // console.log(event.state.box);
  // showSection(event.state.box);
  load_mailbox(event.state.box);
}

//enable users to return to previous page
function showSection(box) {
  fetch(`/#${box}`)
  .then(response => response.text())
  .then(text => {
      console.log(text);
  });

}

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  // document.querySelector('#send').addEventListener('click', send_email);
  document.querySelector('#compose-form').onsubmit = () => {
    send_email();
    return false;
  }
  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email').style.display = 'none';
  
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  const box = mailbox;
  history.pushState({box: box}, '', `#${box}`);
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  //Extract emails from API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(result => {
    result.forEach(function(message) {
      console.log(message);
      const element = document.createElement('div');
      const sender = document.createElement('div');
      const subject = document.createElement('div');
      const timing = document.createElement('div');
      timing.setAttribute('id', 'time');
      sender.setAttribute('class', 'mail-content');
      subject.setAttribute('class', 'mail-content')
      element.setAttribute('id', 'mail');
      
      sender.append(message.sender);
      subject.append(message.subject);
      timing.append(message.timestamp);
      element.append(sender);
      element.append(subject);  
      element.append(timing);   
      if (message.read === true) {
        element.setAttribute('id', 'read');
      }

      element.addEventListener('click', function() {
      load_email(message.id, message.archived, mailbox);
    });

    document.querySelector('#emails-view').append(element);
    });
  })
}


function load_email(id, archiveStat, mailboxName) {
  document.querySelector('#email').style.display = 'block';
  document.querySelector('#email').innerHTML = '';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const mail = document.createElement('div');
    mail.innerHTML = `
    <div><strong>From:</strong> ${email.sender}</div>
    <div><strong>To:</strong> ${email.recipients}</div>
    <div><strong>Subject:</strong> ${email.subject}</div>
    <div><strong>Timestamp:</strong> ${email.timestamp}</div>
    <hr>
    <div id='message-body'>${email.body}</div>
    <hr>
    <div id='buttons' class='button-container'>
      <form>
        <input class='button btn-outline-primary' id='reply' type='submit' value='Reply'>
      </form>
    </div>
    `
    document.querySelector('#email').append(mail);

    //check if we are not in the 'sent' mailbox, create the archive/unarchive buttons
    if (mailboxName !== 'sent') {
      //create archive or unarchive button depending on whether the email has been archived or not
      if (archiveStat === false) {
        var val = 'Archive';
        var action = function() {
          archive_email(id);
        };

      }
      else {
        var val = 'Unarchive';
        var action = function() {
          unarchive_email(id);
        };
      }

      const archiveForm = document.createElement('form');
      const archiveSubmit = document.createElement('input');
      archiveSubmit.id = 'archive';
      archiveSubmit.type = 'submit';
      archiveSubmit.className = 'button btn-outline-primary';
      archiveSubmit.value = val;
      archiveForm.append(archiveSubmit);
      document.querySelector('#buttons').append(archiveForm);

      //archive the email
      const archive = document.querySelector('#archive');
      archive.addEventListener('click', function() {
        action();
      });
    }
    
    //reply to email
    const reply = document.querySelector('#reply');
    reply.addEventListener('click', function() {
      reply_email(id);
    });

/////STOPPED HERE ON 2 JAN
//Problem: when reply is clicked, it archives the email. why?
//4 JAN: Solved problem. 'action' function was not declared as a var and not declared as an annonymous function, causing the functions to be called immediately when the email was clicked on and not only when the archive button was clicked on
  });
  
  //set read to true
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}


function archive_email(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })
}


function unarchive_email(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
}
   

function reply_email(id) {
  event.preventDefault();
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const subject = email.subject;
    const body = email.body;
    const timestamp = email.timestamp;
    const sender = email.sender;
    compose_email(); 
    document.querySelector('#compose-recipients').value = sender;
    if (subject.includes('Re:')) {
      document.querySelector('#compose-subject').value = subject;
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${subject}`;
    }
    document.querySelector('#compose-body').value = `On ${timestamp}, ${sender} wrote:\n \n ${body} \n`;
  })
}


function send_email() {
  // event.preventDefault();

  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result);
      load_mailbox('sent');
  });
}