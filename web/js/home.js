$(function() {
	$('#teamname').keypress(function(e) {
		if(e.keyCode != 13) return;
		
		//console.log("return on team name", $('#teamname').val());
		
// 		var url = "http://roderic.us/teams/";
// 		
// 		$.post(url, { name: $('#teamname').val() }, function(data, textStatus, jqXHR) {
// 			console.log(data, textStatus, jqXHR);
// 		});

		var result = { name: $('#teamname').val(), id: "fe3dc0" };
		
		if(result.id) {
			window.location.href = "/enterdata.html";
		}
	});
	
	$('#code').keypress(function(e) {
		if(e.keyCode != 13) return;
		
		var result = { name: $('#teamname').val(), id: "fe3dc0" };
		
		if(result.id) {
			window.location.href = "/enterdata.html";
		}
	});
});