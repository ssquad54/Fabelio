/**
 * @NAPIVersion 2.x
 * @NScriptType UserEventScript
 */
//
// nama: Gill - SO Terbilang UE
// id: _gill_so_terbilang_ue
// func: Terbilang dalam bahasa Indonesia atas Amount Total
// by: Dio Pratama, 2019
//
define([ "N/record" ], function(record) {
	// -------------------------------------------------------------------------------------------------
	const
	CENT = 0;
	const
	POINT = 1;
	const
	NOMINAL = Array("Nol", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan");
	const
	THOUDELIM = ".";
	const
	DECDELIM = ",";

	function initCap_(str) {
		return str.toLowerCase().replace(/(?:^|\s)[a-z]/g, function(m) {
			return m.toUpperCase();
		});
	}
	;

	function threedigit(word) {
		while (word.length < 3) {
			word = ("0000000" + word).slice(-3);
		}
		word = word.split("");
		a = word[0];
		b = word[1];
		c = word[2];
		word = "";
		word += (a != "0" ? (a != "1" ? NOMINAL[parseInt(a)] : "Se") : "")
				+ (a != "0" ? (a != "1" ? " Ratus" : "ratus") : "");
		word += " " + (b != "0" ? (b != "1" ? NOMINAL[parseInt(b)] : "Se") : "")
				+ (b != "0" ? (b != "1" ? " Puluh" : "puluh") : "");
		word += " " + (c != "0" ? NOMINAL[parseInt(c)] : "");
		word = word.replace(/Sepuluh ([^ ]+)/gi, "$1 Belas");
		word = word.replace(/Satu Belas/gi, "Sebelas");
		word = word.replace(/^[ ]+$/gi, "");

		return word;
	}

	function twodigitcent(cent) {
		while (cent.length < 2) {
			cent = (cent + "0000000").substr(0, 2);
		}
		cent = cent.split("");
		a = cent[0];
		b = cent[1];
		cent = "";
		cent += (a != "0" ? (a != "1" ? NOMINAL[parseInt(a)] : "Se") : NOMINAL[parseInt(a)])
				+ (a != "0" ? (a != "1" ? " Puluh" : "puluh") : "");
		cent += " " + (b != "0" ? NOMINAL[parseInt(b)] : "");
		cent = cent.replace(/Sepuluh ([^ ]+)/gi, "$1 Belas");
		cent = cent.replace(/Satu Belas/gi, "Sebelas");
		cent = cent.replace(/^[ ]+$/gi, "");

		return cent;
	}

	function terbilang(s, t, curr) {
		var r = 2;
		if (isNaN(t)) {
			t.toUpperCase().replace(/^\s+|\s+$/g, '');
			t = t == "POINT" ? POINT : CENT;
		}
		t = t == POINT ? POINT : CENT;

		s += "";
		regexp = /^(\d*\.\d+|\d+)$/gi

		if (regexp.test(s)) {
			s = s.replace(/^0+/gi, "");
			var zero3 = Array("", "Ribu", "Juta", "Milyar", "Trilyun", "Kuadriliun", "Kuantiliun", "Sekstiliun",
					"Septiliun", "Oktiliun", "Noniliun", "Desiliun");

			s = (parseFloat(s)).toFixed(r);
			s = s.split(".");

			var word = s[0];
			var cent = s[1];
			if (cent.length < 2) {
				cent += "0";
			}

			var tWord = "";
			var tCent = "";
			var subword = "";
			i = 0;
			while (word.length > 3) {
				subdigit = threedigit(word.substr(word.length - 3, 3));
				subword = subdigit + (subdigit != "" ? " " + zero3[i] + " " : "") + subword;
				word = word.substring(0, word.length - 3);
				i++;
			}
			subword = threedigit(word) + " " + zero3[i] + " " + subword;
			subword = subword.replace(/^ +$/gi, "");

			tWord = (subword == "" ? "NOL" : subword.toUpperCase());

			if (parseInt(s[1]) > 0) {
				tCent += (t == CENT ? " " + curr : " KOMA")

				if (t == CENT) {
					subword = twodigitcent(cent);
				} else {
					// subword=[];
					// for(i in cent) subword.push(NOMINAL[cent[i]]);
					// subword=subword.join(" ");
					subword = twodigitcent(cent);
				}
				tCent += (subword == "" ? "" : " ") + subword.toUpperCase()
						+ (subword == "" || t == POINT ? " " + curr : " SEN");
			} else {
				tCent += curr;
			}

			return (tWord + tCent);
		} else
			return "ERROR: Invalid number format";
	}
	// -------------------------------------------------------------------------------------------------

	function beforeSubmit(context) {
		var sayit;
		var rec = context.newRecord;

		if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
			log.debug({
				"title" : "check: record",
				"details" : rec
			});

			var soId = rec.getValue({
				fieldId : 'id'
			});
			log.debug({
				"title" : "check: SO.id",
				"details" : soId
			});

			var amt = rec.getValue({
				fieldId : 'total'
			});
			log.debug({
				"title" : "check: total",
				"details" : amt
			});

			var currname = rec.getValue({
				fieldId : 'currencyname'
			});
			log.debug({
				"title" : "check: currencyname",
				"details" : currname
			});

			sayit = terbilang(amt, 'POINT', currname);
			log.debug({
				"title" : "terbilang: total",
				"details" : sayit
			});

			log.debug({
				"title" : "start check: custbody20",
				"details" : rec.getValue({
					fieldId : 'custbody20'
				})
			});
			rec.setValue('custbody20', sayit.replace(/\s\s+/g, ' ').trim(), true);
			log.debug({
				"title" : "end check: custbody20",
				"details" : rec.getValue({
					fieldId : 'custbody20'
				})
			});
		}
	}

	return {
		beforeSubmit : beforeSubmit
	};
});