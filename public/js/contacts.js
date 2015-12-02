var dt;
$(document).ready(function(e) {
	dt = dynamicTable.config('contactlist',
	        ['id', 'status', 'note'],
	        ['Contact', 'Status', 'Note'],
	        'No contacts.');
});

function addOrUpdateContact(id, status, note) {
//	window.localStorage.setItem("ltu.lab3.contacts", null);
	var contacts = JSON.parse(window.localStorage.getItem("ltu.lab3.contacts"));
	var datachanged = false;
	if (!contacts) {
		contacts = [];
		contacts.push({id:id,status:status,note:note});
		datachanged = true;
	} else {
		var found = false;
		for (var i = 0; i < contacts.length; i++) {
			console.log(contacts);
			console.log("new: "+id+";"+status+";"+note);
			if (contacts[i].id == id) {
				if ((contacts[i].status != status) || (contacts[i].note != note)) {
					contacts[i].status = status;
					contacts[i].note = note;
					datachanged = true;
				}
				found = true;
			}
		}
		if (!found) {
			contacts.push({id:id,status:status,note:note});
			datachanged = true;
		}
	}
	if (datachanged) {
		window.localStorage.setItem("ltu.lab3.contacts", JSON.stringify(contacts));
		refreshContactList();
	}
}

function initSubscriptions() {
//	window.localStorage.setItem("ltu.lab3.contacts", null);
	var contacts = JSON.parse(window.localStorage.getItem("ltu.lab3.contacts"));
	console.log(contacts);
	if (contacts) {
		for (var i = 0; i < contacts.length; i++) {
			subscribePresence(contacts[i].id);
		}
		refreshContactList();
	}
}

function refreshContactList() {
	var contacts = JSON.parse(window.localStorage.getItem("ltu.lab3.contacts"));
	dt.load(contacts);
//	loadTable('contact-list', ['id', 'status', 'note'], contacts);
//	for (var i = 0; i < contacts.length; i++) {
//	    console.log(contacts[i]);
//	}
}