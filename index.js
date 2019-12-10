function longestCS(a, b) {
	var matrix = [];

	var maxLength = 0;
	var aPos = 0;
	var bPos = 0;
	var curRow = Array(b.length).map((a)=>(0)), prewRow;
	if (a.length && b.length) {
		if (a == b) {
			maxLength = a.length;
		}
		else{
			for (var i = 0; i < a.length; i++) {
				//matrix[i] = [];
				prevRow = curRow;
				curRow = [];
				for (var j = 0; j < b.length; j++) {
					if(a[i] == b[j]){
						if (i != 0 && j != 0) {
							curRow[j] = (prevRow[j-1]||0) + 1;
						} else {
							curRow[j] = 1;
						}
						if (curRow[j] > maxLength) {
							maxLength = curRow[j];
							aPos = i+1;
							bPos = j+1;
						}
					}
					else{
						curRow[j] = 0;
					}
				}
			}
		}
	}
	return {
		a:[aPos - maxLength, aPos, maxLength],
		b:[bPos - maxLength, bPos, maxLength],
		value:a.slice(aPos - maxLength, aPos)
	};
}

function split2pos(a, pos1, pos2){
	return [a.slice(0, pos1), a.slice(pos1, pos2), a.slice(pos2)];
}

function splitNWrap(arr, pos){
	var a = arr.pop();
	arr.push([a.slice(0, pos[0])], a.slice(pos[0], pos[1]), [a.slice(pos[1])]);
}

function compare(a, b){
	a = [a];
	b = [b];
	
	function spliter(a, b){
		var n = longestCS(a[0], b[0]);
		if(n.value.length){
			splitNWrap(a, n.a);	//Делает из одночленного массива - трёхчленный, где нулевой и второй члены - одночленные массивы
			splitNWrap(b, n.b);
			spliter(a[0], b[0]);
			spliter(a[2], b[2]);
			a.splice.apply(a, [0, 3].concat(a[0], [a[1]], a[2]));
			b.splice.apply(b, [0, 3].concat(b[0], [b[1]], b[2]));
		}
	}
	
	spliter(a,b);
	
	return {
		a:a,
		b:b
	}
	
}

function distinction(compare_result){
	var a = compare_result.a, 
		b = compare_result.b, 
		aPos = 0, bPos = 0, 
		len = a.length, i=0;
	var report = [];
	for(;i<len;++i){
		if(a[i].toString()!=b[i].toString()){
			if(!a[i].length){
				report.push({type:'b', aPos:aPos, bPos:bPos, a:a[i], b:b[i]});
			}
			else if(!b[i].length){
				report.push({type:'a', aPos:aPos, bPos:bPos, a:a[i], b:b[i]});
			}
			else{
				report.push({type:'~', aPos:aPos, bPos:bPos, a:a[i], b:b[i]});
			}
		}
		aPos += a[i].length;
		bPos += b[i].length;
	}
	return report;
}

function cruxRule(part1, part2){
	if(part1.aPos == part2.aPos){
		if(part1.a.length == part2.a.length && part1.b.toString() == part2.b.toString()){
			return 'equal';
		}
	}
	else if(part1.aPos < part2.aPos){
		if(part1.aPos + part1.a.length <= part2.aPos){
			return 'skip1';
		}
	}
	else if(part2.aPos < part1.aPos){
		if(part2.aPos + part2.a.length <= part1.aPos){
			return 'skip2';
		}
	}
	return 'conflict';
}

function mergeDist(dist1, dist2){
	var index1 = 0, index2 = 0, pos1, pos2, len1=dist1.length, len2=dist2.length;
	var result = [], conflict = [];
	while(index1<len1 && index2<len2){
		switch(cruxRule(dist1[index1], dist2[index2])){
			case 'skip1': result.push(dist1[index1]); ++index1; break;
			case 'skip2': result.push(dist2[index2]); ++index2; break;
			case 'equal': result.push(dist2[index2]); ++index2; ++index1; break;
			default:
				conflict.push([dist1[index1], dist2[index2]]);
				 ++index2; ++index1;
		}
	}
	while(index2<len2){
		result.push(dist2[index2]); ++index2;
	}	
	while(index1<len1){
		result.push(dist1[index1]); ++index1;
	}
	return {
		merge:result,
		conflict:conflict,
		isConflict:!!conflict.length
	};
}

function wordDel(text){
	return text.split(/(<[^>]+>|\s+)/).filter((a)=>(a));
}

function Numerator(del){
	var hash = {}, uid = 0, rev = {};
	
	function get(str){
		if(!(str in hash)){
			hash[str] = uid;
			rev[uid] = str;
			++uid;
			ok = false;
			//console.log(str);
			return hash[str];
		}
		return hash[str];
	}
	function str(index){
		return rev[index];
	}
	
	var splitter;
	if(typeof del == 'function'){
		splitter = del;
		del = '';
	}
	else{
		splitter = (text)=>(text.toString().split(del));
	}
	
	return {
		get:get,
		str:str,
		prepareStr:function(text){
			return splitter(text).map(get)
		},
		restoreStr:function(data){
			return data.map(str).join(del);
		}
	};
}

function commandByDistinct(distinct){
	return distinct.map(function(part){
		switch(part.type){
			case 'a':
				return [part.aPos, part.a.length];
			case 'b':
				return [part.aPos, 0].concat(part.b);
			case '~':
				return [part.aPos, part.a.length].concat(part.b);;
		}
	});
}
function applyDistinct(a, distinct){
	distinct = distinct.slice(0).sort((a,b)=>(b.aPos-a.aPos));
	a = a.slice(0);
	var splice = a.splice;
	distinct.map(function(part){
		switch(part.type){
			case 'a':
				splice.apply(a, [part.aPos, part.a.length]);
			case 'b':
				splice.apply(a, [part.aPos, 0].concat(part.b));
			case '~':
				splice.apply(a, [part.aPos, part.a.length].concat(part.b));
		}
	});
	return a;
}


function visualDistinctItem(num, part){
	var show = [];
	part = restoreStrDistinktItem(num, part);
	
	
	if(part.type == 'a'){
		show.push(
			'--- Line ' + part.aPos + ':\r\n' + part.a + '\r\n/---'
		);
	}
	else if(part.type == 'b'){
		show.push(
			'+++ Line ' + part.aPos + ':\r\n' + part.b +	'\r\n/+++'
		);
	}
	else if(part.type == '~'){
		show.push(
			'    Line ' + part.aPos + ':\r\n' +
			(new Comparator(wordDel, part.a)).reportDiff(part.b, function(part){
				var str = [];
				if(part.type == 'a'){
					return '--- part ' + part.aPos + ': ' + JSON.stringify(part.a);
				}
				else if(part.type == 'b'){
					return '+++ part ' + part.aPos + ': ' + JSON.stringify(part.b);
				}
				else if(part.type == '~'){
					return '~~~ part ' + part.aPos + ': ' + JSON.stringify(part.a) + ' => ' + JSON.stringify(part.b);
				}
			}, '\r\n')
		);
		
	}
	return show.join('\r\n');
}

function restoreStrDistinktItem(num, part){
	return {
		type:part.type, 
		aPos:part.aPos, 
		bPos:part.bPos, 
		a:part.a && num.restoreStr(part.a), 
		b:part.b && num.restoreStr(part.b)
	};
}

function visualDistinct(num, distinct){
	var show;
	show = distinct.map(visualDistinctItem.bind(this, num));
	return show.join('\r\n\r\n');
}

function visualCommand(a, commands, num){
	var show = [];
	commands.map(function(command){
		if(command[1]>0){
			show.push(
				'--- ' + command[0] + ':\r\n' +
				num.restoreStr(a.slice(command[0], command[0]+command[1])) +
				'\r\n/---'
			);
		}
		if(command.length>2){
			show.push(
				'+++ ' + command[0] + ':\r\n' +
				num.restoreStr(command.slice(2)) +
				'\r\n/+++'
			);
		}
	});
	return show.join('\r\n\r\n');
}

function execCommand(a, commands){
	commands = commands.slice(0).sort((a,b)=>(b[0]-a[0]));
	a = a.slice(0);
	splice = a.splice;
	commands.map(function(command){
		splice.apply(a, command);
	});
	return a;
}

function Comparator(del, base){
	var num = Numerator(del),
		prepare = num.prepareStr;
	base = prepare(base);
	
	return {
		rebase:function(newBase){
			base = prepare(newBase);
		},
		reportDiff:function(code, renderer, sep){
			code = prepare(code);
			var dist = distinction(compare(base, code));
			return dist.map((part)=>(renderer(restoreStrDistinktItem(num, part)))).join(sep);
		},
		showDiff:function(code){
			code = prepare(code);
			return visualDistinct(num, distinction(compare(base, code)));
		},
		hasDiff:function(code){
			code = prepare(code);
			return distinction(compare(base, code)).length > 0;
		},
		merge:function(parts){
			parts = parts.map(prepare);
			var res = parts.map(function(code){
				return distinction(compare(base, code));
			});
			//console.log('compare ok');
			var merge = mergeDist(res[0], res[1]);
			//var commands = commandByDistinct(merge.merge);
			if(!merge.isConflict){
				merge.newcode = num.restoreStr(applyDistinct(base, merge.merge));
			}
			else{
				merge.partialApply = function(){
					this.newcode = num.restoreStr(applyDistinct(base, this.merge));
				}
				merge.report = function(){
					return this.conflict.map((part)=>{
						return [part[0].a, part[0].b, part[1].a, part[1].b].map((obj)=>(num.restoreStr(obj))).join('\r\n');
					}).join('\r\n\r\n');
				}
			}
			return merge;
		}
	}
}

Comparator.Numerator = Numerator;

Comparator.compare = compare;
Comparator.showDiffString = function showDiffString(a,b){
	var compare_result = compare(a, b),
		a = compare_result.a, 
		b = compare_result.b,
		len = a.length, i=0, ai, bi, d;
	for(;i<len;++i){
		ai=a[i]=a[i].toString();
		bi=b[i]=b[i].toString();
		d = ai.length - bi.length;
		if(d<0){
			a[i] = ai+Array(1-d).join(' ');
		}
		else if(d>0){
			b[i] = bi+Array(1+d).join(' ');
		}
	}
	return {a:a, b:b};
};
Comparator.diffLength = function(a, b){
	var compare_result = compare(a, b),
		a = compare_result.a, 
		b = compare_result.b, 
		len = a.length, i=0,
		result = 0;
	for(;i<len;++i){
		if(a[i].toString()!=b[i].toString()){
			result += Math.max(a[i].length, b[i].length);
		}
	}
	return result;
};

module.exports = Comparator;