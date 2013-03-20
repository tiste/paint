var history = [];
var paint, canvas, canvasCopy, context, text = "", color, colorRGB, thickness, font, tool;
var mousedown, mousemove, mouseup;
var flag = 0, pos, startPixel;


function colorPixel(pixelPosition) {
	canvasCopy.data[pixelPosition] = colorRGB.R;
	canvasCopy.data[pixelPosition+1] = colorRGB.G;
	canvasCopy.data[pixelPosition+2] = colorRGB.B;
	canvasCopy.data[pixelPosition+3] = 255;
}

function matchColor(pixelPosition) {
	var r = canvasCopy.data[pixelPosition];
	var g = canvasCopy.data[pixelPosition+1];
	var b = canvasCopy.data[pixelPosition+2];
	var a = canvasCopy.data[pixelPosition+3];

	return (r == startPixel.data[0] && g == startPixel.data[1] && b == startPixel.data[2] && a == startPixel.data[3]);
}

function hexToRGB(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	return result ? {
		R: parseInt(result[1], 16), 
		G: parseInt(result[2], 16), 
		B: parseInt(result[3], 16)
	} : null;
}

function changeColor() {
	color = document.getElementById("color").value;
	colorRGB = hexToRGB(color);
}

function changeThickness() {
	thickness = document.getElementById("thickness").value;
}

function changeFont() {
	font = document.getElementById("font").value;
}

function showText() {
	$(".textContent").slideToggle(200, function () {
		$("#text").val("");
		text = "";
		$("#text").focus();
	});
}

function popup(text) {
	if ($(".popup").length > 0) {
		$(".popup").after('<div class="popup">' + text + '</div>');
	} else {
		$("body").prepend('<div class="popup">' + text + '</div>');
	}

	$(".popup").css({
		'right': 500,
		'left': 500,
		'height': 10,
		'font-size': 14,
		'opacity': 0
	}).animate({
		'right': 400,
		'left': 400,
		'height': 25,
		'font-size': 20,
		'opacity': 1
	}, 1000, 'easeOutElastic', function () {
		$(this).fadeOut(500, function () {
			$(this).remove();
		});
	});
}

function setPaint() {
	if (paint != undefined) {
		paint.removeListener();
	}

	paint = new Paint("paint");
}

$(window).load(function () {
	tool = $("#tools .active").attr("data-tool");
	changeColor();
	changeThickness();
	changeFont();
	setPaint();
	canvas.setAttribute("width", $(".span10").width());
	canvas.setAttribute("height", $(window).height());
	history.push(canvas.toDataURL());

	// Change tool
	$("#tools .btn").click(function (e) {
		tool = $(this).attr("data-tool");
		popup($(this).val());
		setPaint();
	});

	canvas.addEventListener("dragover", paint.beginImport);
	canvas.addEventListener("dragleave", paint.beginImport);
	canvas.addEventListener("drop", paint.import);
	canvas.addEventListener("mousemove", function (e) {
		pos = getMousePos(e);
	});

	// CTRL + Z
	var ctrlDown = false;
	window.addEventListener("keydown", function (e) {
		if (e.keyCode == 91) {
			ctrlDown = true;
		}

		if (ctrlDown && e.keyCode == 90) {
			undoCanvas(history.length-2);
			e.preventDefault();
		}

		if (ctrlDown && e.keyCode == 83) {
			paint.exportCanvas();
			e.preventDefault();
		}
	});
	window.addEventListener("keyup", function (e) {
		if (e.keyCode == 91) {
			ctrlDown = false;
		}
	});

	// Zoom
	var zoom = 0.9;
	$(canvas).bind("mousewheel", function (e) {
		if (e.originalEvent.wheelDelta < 0) {
			// Scroll down
			
			zoom += 0.1;
		} else {
			// Scroll up
			
			if (zoom > 0.1) {
				zoom -= 0.1;
			}
		}

		context.save();
		context.translate(pos.x, pos.y);
		context.scale(zoom, zoom);
		context.translate(-pos.x, -pos.y);
		context.clearRect(0, 0, canvas.width, canvas.height);
		paint.draw();
		context.restore();
	});
});

function getMousePos(e) {
	var rect = canvas.getBoundingClientRect();
	
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top
	};
}

function Paint(id) {
	canvas = document.getElementById(id);
	context = canvas.getContext("2d");

	switch (tool) {
		case "pen":
			flag = 0;

			canvas.addEventListener("mousedown", mousedown = function (e) {
				flag = 1;

				context.beginPath();
				context.moveTo(pos.x, pos.y);
			});

			canvas.addEventListener("mousemove", mousemove = function (e) {
				if (flag) {
					context.lineTo(pos.x, pos.y);
					context.strokeStyle = color;
					context.lineWidth = thickness;
					context.lineCap = 'round';
					context.stroke();
				}
			});
			
			canvas.addEventListener("mouseup", mouseup = function (e) {
				flag = 0;

				history.push(canvas.toDataURL());
				paint.draw();
			});
			break;

		case "text":
			flag = 0;

			canvas.addEventListener("mousedown", mousedown = function (e) {
				if (!flag) {
					flag = 1;

					showText();
				} else {
					flag = 0;

					context.font = thickness+"px "+font;
					context.fillText(text, pos.x, pos.y);
					context.fillStyle = color;

					history.push(canvas.toDataURL());
					paint.draw();
					showText();
				}
			});

			canvas.addEventListener("mousemove", mousemove = function (e) {
				if (flag) {
					context.clearRect(0, 0, canvas.width, canvas.height);

					paint.draw();
					context.font = thickness+"px "+font;
					context.fillText(text, pos.x, pos.y);
					context.fillStyle = color;
				}
			});

			document.getElementById("text").addEventListener("keyup", function (e) {
				if (flag) {
					context.clearRect(0, 0, canvas.width, canvas.height);

					paint.draw();
					text = document.getElementById("text").value;
					context.font = thickness+"px "+font;
					context.fillText(text, pos.x, pos.y);
					context.fillStyle = color;
				}
			});
			break;

		case "line":
			flag = 0;
			var x = 0, y = 0;

			canvas.addEventListener("mousedown", mousedown = function (e) {
				flag = 1;

				x = pos.x;
				y = pos.y;
			});

			canvas.addEventListener("mousemove", mousemove = function (e) {
				if (flag) {
					context.clearRect(0, 0, canvas.width, canvas.height);

					paint.draw();
					context.beginPath();
					context.moveTo(x, y);
					context.lineTo(pos.x, pos.y);
					context.strokeStyle = color;
					context.lineWidth = thickness;
					context.lineCap = 'round';
					context.stroke();
				}
			});
			
			canvas.addEventListener("mouseup", mouseup = function (e) {
				flag = 0;

				context.beginPath();
				context.moveTo(x, y);
				context.lineTo(pos.x, pos.y);
				context.strokeStyle = color;
				context.lineWidth = thickness;
				context.lineCap = 'round';
				context.stroke();

				history.push(canvas.toDataURL());
				paint.draw();
			});
			break;

		case "circle":
			flag = 0;
			var x = 0, y = 0;

			canvas.addEventListener("mousedown", mousedown = function (e) {
				flag = 1;

				x = pos.x;
				y = pos.y;
			});

			canvas.addEventListener("mousemove", mousemove = function (e) {
				if (flag) {
					var radius = Math.sqrt(Math.pow((pos.x-x), 2) + Math.pow((pos.y-y), 2));
					context.clearRect(0, 0, canvas.width, canvas.height);

					paint.draw();
					context.beginPath();
					context.arc(x, y, radius, 0, Math.PI*2, false); 
					context.strokeStyle = color;
					context.lineWidth = thickness;
					context.stroke();
				}
			});
			
			canvas.addEventListener("mouseup", mouseup = function (e) {
				flag = 0;

				var radius = Math.sqrt(Math.pow((pos.x-x), 2) + Math.pow((pos.y-y), 2));

				context.beginPath();
				context.arc(x, y, radius, 0, Math.PI*2, false); 
				context.strokeStyle = color;
				context.lineWidth = thickness;
				context.stroke();

				history.push(canvas.toDataURL());
				paint.draw();
			});
			break;

		case "rectangle":
			flag = 0;
			var x = 0, y = 0;

			canvas.addEventListener("mousedown", mousedown = function (e) {
				flag = 1;

				x = pos.x;
				y = pos.y;
			});

			canvas.addEventListener("mousemove", mousemove = function (e) {
				if (flag) {
					context.clearRect(0, 0, canvas.width, canvas.height);

					paint.draw();
					context.beginPath();
					context.rect(x, y, pos.x-x, pos.y-y);
					context.strokeStyle = color;
					context.lineWidth = thickness;
					context.stroke();
				}
			});
			
			canvas.addEventListener("mouseup", mouseup = function (e) {
				flag = 0;
				
				context.beginPath();
				context.rect(x, y, pos.x-x, pos.y-y);
				context.strokeStyle = color;
				context.lineWidth = thickness;
				context.stroke();

				history.push(canvas.toDataURL());
				paint.draw();
			});
			break;

		case "pot":
			canvas.addEventListener("mousedown", mousedown = function (e) {
				startPixel = context.getImageData(pos.x, pos.y, 1, 1);
				canvasCopy = context.getImageData(0, 0, canvas.width, canvas.height);
				paint.pot(pos.x, pos.y);
				context.putImageData(canvasCopy, 0, 0);

				history.push(canvas.toDataURL());
				paint.draw();
			});
			break;

		case "rubber":
			flag = 0;

			canvas.addEventListener("mousedown", mousedown = function (e) {
				flag = 1;
			});

			canvas.addEventListener("mousemove", mousemove = function (e) {
				if (flag) {
					context.clearRect(pos.x, pos.y, thickness, thickness);
				}
			});
			
			canvas.addEventListener("mouseup", mouseup = function (e) {
				flag = 0;

				history.push(canvas.toDataURL());
				paint.draw();
			});
			break;

		case "copy":
			flag = 0;
			var x = 0, y = 0, copy = 0, copying = 0;

			canvas.addEventListener("mousedown", mousedown = function (e) {
				if (!copying) {
					flag = 1;

					x = pos.x;
					y = pos.y;
				}
			});

			canvas.addEventListener("mousemove", mousemove = function (e) {
				if (flag) {
					context.clearRect(0, 0, canvas.width, canvas.height);

					paint.draw();
					context.beginPath();
					context.rect(x, y, pos.x-x, pos.y-y);
					context.strokeStyle = "#000000";
					context.lineWidth = "3";
					context.stroke();
				}

				if (copying) {
					context.clearRect(0, 0, canvas.width, canvas.height);

					paint.draw();
					context.putImageData(copy, pos.x, pos.y);
				}
			});
			
			canvas.addEventListener("mouseup", mouseup = function (e) {
				flag = 0;

				if (!copying) {
					copying = 1;
					context.clearRect(0, 0, canvas.width, canvas.height);
					paint.draw();
					
					copy = context.getImageData(x, y, pos.x-x, pos.y-y);
				} else {
					copying = 0;
					context.putImageData(copy, pos.x, pos.y);

					history.push(canvas.toDataURL());
					paint.draw();
					popup("Coller");
				}
			});
			break;

		default:
			break;
	}

	this.pot = function (startX, startY) {
		pixelStack = [[startX, startY]];

		while (pixelStack.length) {
			var newPos, x, y, pixelPos, reachLeft, reachRight;
			newPos = pixelStack.pop();
			x = newPos[0];
			y = newPos[1];

			pixelPos = (y*canvas.width + x) * 4;
			while (y-- >= 1 && matchColor(pixelPos)) {
				pixelPos -= canvas.width * 4;
			}

			pixelPos += canvas.width * 4;
			y++;
			reachLeft = false;
			reachRight = false;
			while (y++ < canvas.height-1 && matchColor(pixelPos)) {
				colorPixel(pixelPos);
				
				if (x > 0) {
					if (matchColor(pixelPos - 4)) {
						if (!reachLeft) {
							pixelStack.push([x - 1, y]);
							reachLeft = true;
						}
					} else if (reachLeft) {
						reachLeft = false;
					}
				}
				
				if (x < canvas.width-1) {
					if (matchColor(pixelPos + 4)) {
						if (!reachRight) {
							pixelStack.push([x + 1, y]);
							reachRight = true;
						}
					} else if (reachRight) {
						reachRight = false;
					}
				}

				pixelPos += canvas.width * 4;
			}
		}
	}

	this.draw = function () {
		var tmp = new Image();
		$(".layers").html("");

		for (var i = 0; i < history.length; i++) {
			tmp.src = history[i];
			$(".layers").prepend('<img src="'+history[i]+'" onclick="undoCanvas('+i+')" /><hr />');
		}

		context.drawImage(tmp, 0, 0);
	}

	this.removeListener = function () {
		canvas.removeEventListener("mousedown", mousedown);
		canvas.removeEventListener("mousemove", mousemove);
		canvas.removeEventListener("mouseup", mouseup);
	}

	this.exportCanvas = function () {
		$.ajax({
			url: "exportCanvas.php",
			data: {
				"base64": history[history.length-1]
			},
			dataType: "text",
			type: "POST",
			success: function (data) {
				popup(data);
			}
		});
	}

	this.beginImport = function (e) {
		e.stopPropagation();
		e.preventDefault();
	}

	this.import = function (e) {
		paint.beginImport(e);
		var img = new Image();
		var fReader = new FileReader();

		var file = (e.dataTransfer==undefined) ? e.target.files[0] : e.dataTransfer.files[0];
		fReader.readAsDataURL(file);

		
		fReader.onload = function (e) {
			img.src = e.target.result;
		};

		img.onload = function () {
			paint.removeListener();
			canvas.addEventListener("mousedown", mousedown = function (e) {
				context.drawImage(img, pos.x, pos.y);
			});

			canvas.addEventListener("mousemove", mousemove = function (e) {
				context.clearRect(0, 0, canvas.width, canvas.height);

				paint.draw();
				context.drawImage(img, pos.x, pos.y);
			});

			canvas.addEventListener("mouseup", mouseup = function (e) {
				history.push(canvas.toDataURL());
				paint.draw();
				setPaint();
				popup("Image importée");
			});
		}
	}
}

function undoCanvas(id) {
	context.clearRect(0, 0, canvas.width, canvas.height);

	for (var i = history.length-1; i > id; i--) {
		history.pop();
	}
	
	paint.draw();
}