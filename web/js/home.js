$(function() {
	function setCookie(c_name,c_value,c_expiredays) {
		var exdate = new Date();
		exdate.setDate(exdate.getDate() + c_expiredays);
		document.cookie = c_name+ "=" +escape(c_value)+
		((c_expiredays==null) ? "" : ";expires="+exdate.toGMTString());
	}

	$('#teamname').keypress(function(e) {
		if(e.keyCode != 13) return;
		
		var url = "http://hillcrest.roderic.us/api/teams/";
		
		$.post(url, { name: $('#teamname').val() }, function(data, textStatus, jqXHR) {
			if(data) {
				setCookie("teamCode", data.id);
				setCookie("teamName", data.name);
				
				window.location.href = "/clues";
			}
		});
	});
	
	$('#code').keypress(function(e) {
		if(e.keyCode != 13) return;
		
		var url = "http://hillcrest.roderic.us/api/teams/" + $('#code').val() + "/";
		
		$.getJSON(url, function(data) {
			if(data) {
				setCookie("teamCode", data.id);
				setCookie("teamName", data.name);
				
				window.location.href = "/clues";
			}
		});
	});
});