// time array
var timeArray = [];

// Onload Function
var onLoad = function () {
    var dateTime = getDate();

    timeArray = localStorage.getItem("Time");

    // Expected output "Sunday, 20 December 2020 at 14:23:16 GMT+11"
    $('#currentDay').text(new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(dateTime));

    // To change the schedule
    $(".container").sortable({
        connectWith: $(".container"),
        scroll: false,
        tolerance: "intersect",
        cursor: "move",
        delay: 150,
        zIndex: 9999,
        opacity: 0.5,
        items: ".row:not(.past-time)",
        activate: function (event, ui) {
            ui.item.addClass('bg-primary border border-info border-5');
        },
        deactivate: function (event, ui) {
            ui.item.removeClass('bg-primary border border-info border-5 ');
        },
        stop: function (event, ui) {
            var position = 0;
            var rowsArray = [];
            timeArray = localStorage.getItem("Time").split(',');

            // Looping through each element and changing the attritube of the changed element
            $('.container').find('.row').each(function () {

                var currentPostion = parseInt($(this).index());
                var previousPostion = parseInt($(this).attr("data-position"));

                // checking the original position with the value in attr(data-position)
                if (Math.abs(currentPostion - previousPostion) > 0) {

                    //Changing the timing of the element to new timing
                    $(this).attr("data-time", timeArray[position]);
                    $(this).find("p").text(timeArray[position]);

                    var time = parseInt(timeArray[position]
                        .split(' ')[0]
                    );
                    var timeOrdinal = timeArray[position]
                        .split(' ')[1]
                        .toLowerCase();

                    // Check for AM/PM of the timings
                    if (timeOrdinal.toLowerCase() === "pm") {
                        time = time + 12;
                    } else if (time === 12 && timeOrdinal.toLowerCase() === 'am') {
                        time = 24;
                    }

                    var currenTime = new Date(
                        new Date()
                            .setHours(time, 0, 0, 0)
                    );

                    auditTask($(this), currenTime);

                    // Setting the data-position value to current position 
                    $(this).attr("data-position", currentPostion);

                    // Saving in Local Storage
                    setValueInLocalStorage(timeOrdinal, $(this)
                        .parent()
                        .find('textarea')
                        .val());
                }
                position++;
            });
        }
    });
    $(".container").disableSelection();

    // Checking on page-reload if the localstorage has value;
    if (timeArray != null && timeArray.length > 0) {
        var arrTime = timeArray.split(',');

        var startTime = getTimeIn24HrsFromat(arrTime[0]);
        var endTime = getTimeIn24HrsFromat(arrTime[arrTime.length - 1]);
        timeArray =[];
        createShedule(startTime, endTime);
        $("#schedule-form-modal").modal('hide');
        $('#clear-btn').show();
        $('#welcome-btn').hide();
    }
    timeArray =[];
};

// Open Model
$("#schedule-form-modal").on("show.bs.modal", function () {
    $('#welcome-btn').hide();
});

// modal is fully visible
$("#schedule-form-modal").on("shown.bs.modal", function () {
    $("#startTime").trigger("focus");
    $("#endTime").trigger("focus");
});

// Close button in modal 
$("#schedule-form-modal .close ").on("click", () => {
    $("#schedule-form-modal").modal("hide");
    $('#welcome-btn').show();
    alert("Thank You for using the schedular")
});

// Save the item in model
$("#schedule-form-modal .btn-save").click(function () {
    // get form values
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();

    if ((startTime && endTime) && (parseInt(startTime) < parseInt(endTime))) {
        // close modal
        $("#schedule-form-modal").modal("hide");
        createShedule(startTime, endTime);
    } else {
        alert("Start time should be less than end time");
        return false;
    }
    $('#clear-btn').show();
    $("#startTime").val('');
    $("#endTime").val('')
});

// Function to get the dates
var getDate = function () {
    var currentDateTime = new Date();
    return currentDateTime;
};

//Dynamically creating the number of schedule 
var createShedule = function (startTime, endTime) {

    var currentTime = getDate();
    var startTime = new Date(currentTime.setHours(parseInt(startTime)));
    var endTime = new Date(currentTime.setHours(parseInt(endTime)));
    var position = 0;

    for (var time = startTime;
        startTime <= endTime;
        startTime.setHours(startTime.getHours() + 1)) {
        createTimeContainer(startTime, position++);
    }
    localStorage.setItem("Time",timeArray)
}

// Creating the HTML for time , schedule , savebtn
var createTimeContainer = function (time, position) {

    var timeOrdinal = time.toLocaleString('en-US', { hour: 'numeric', hour12: true });

    var row = $('<div class="row schedule ui-state-default"></div>');
    $(row).attr("data-time", timeOrdinal);
    $(row).attr("data-position", position);
    var timeContainer = $('<span class="col-2 hour" data-toggle="tooltip" data-placement="bottom" title="Hold and drag to change schedule"><p></p></span>');
    $(timeContainer).find("p").text(timeOrdinal);
    timeArray.push(timeOrdinal);
    var scheduleContainer = $('<textarea class="col-8" data-toggle="tooltip" data-placement="bottom" title="Click to input your schedule"></textarea>');

    var scheduleValue = JSON.parse(getValueFromLocalStorage(timeOrdinal));
    if (scheduleValue != null || scheduleValue != '') {
        $(scheduleContainer).text(scheduleValue);
    } else {
        $(scheduleContainer).text('');
    }

    // $(scheduleContainer).getScheduleValue(time);
    var saveContainer = $('<button class="col-2 saveBtn" data-toggle="tooltip" data-placement="bottom" title="Click to Save"><i class="oi oi-file"></i></button>');

    $(timeContainer).appendTo(row);
    $(scheduleContainer).appendTo(row);
    $(saveContainer).appendTo(row);
    auditTask(row, time);
    $(".container").append(row);
}

var auditTask = function (row, time) {
    
    // get time from the task element
    var timeOrdinal = time.toLocaleString('en-US', { hour: 'numeric', hour12: true });
    var textareaValue = $(row).find('textarea').val();
    var scheduleTime = new Date(time.setMinutes(0, 0, 0)).getTime();
    var currentTime = new Date(new Date().setMinutes(0, 0, 0)).getTime();

    $(row).removeClass('present-time future-time past-time');
    $(row).data('data-time', timeOrdinal).find('textarea').removeClass('present future past');

    // Schedule time is equal than currentime
    if (scheduleTime === currentTime) {
        $(row).data('data-time', timeOrdinal).find('textarea').addClass('present');
        $(row).addClass('present-time');
    }
    // Schedule time is greater than currentime
    else if (scheduleTime > currentTime) {
        $(row).data('data-time', timeOrdinal).find('textarea').addClass('future');
        $(row).addClass('future-time');
    }// Schedule time is less than currentime 
    else if (scheduleTime < currentTime) {
        $(row).data('data-time', timeOrdinal).find('textarea').addClass('past');
        $(row).addClass('past-time');
    }
    setValueInLocalStorage(timeOrdinal, textareaValue);
}

// Get time
var getHour = function (e) {
    return $(e.currentTarget)
        .parent()
        .find(".hour")
        .text()
        .trim();
}

// Click on Save Button 
$(".container").on("click", ".saveBtn", function (e) {

    var textTextArea = $(this)
        .parent()
        .find('textarea')
        .val();

    var hour = getHour(e);

    setValueInLocalStorage(hour, textTextArea);
    alert("Schedule is Saved!!");
});

// Click on Clear Button 
$("#clear-btn").on("click", "button", function (e) {
    timeArray = [];
    localStorage.clear();
    $('#clear-btn').hide();
    $(".container").empty();
    $("#schedule-form-modal").modal('show');
});

// Set Value in LocalStorage
var setValueInLocalStorage = function (key, text) {
    if (key != "" || text !== null) {
        localStorage.setItem(key, text);
    }
};

// Get Value from Local Storage
var getValueFromLocalStorage = function (key) {
    return JSON.stringify(localStorage.getItem(key));
};

// Get Time in 24hrs format
var getTimeIn24HrsFromat = function (hours) {
    var time = parseInt(hours
        .split(' ')[0]
    );
    var timeOrdinal = hours
        .split(' ')[1]
        .toLowerCase();

    // Check for AM/PM of the timings
    if (timeOrdinal.toLowerCase() === "pm" && time === 12){
        time = 12;
    }else if (timeOrdinal.toLowerCase() === "pm") {
        time = time + 12;
    } else if (time === 12 && timeOrdinal.toLowerCase() === 'am') {
        time = 24;
    }
    return time;
}

// Hiding the clear button on load
$('#clear-btn').hide();

// Setting it to auto-saved
setInterval(function () {
    $(".container").children('.row').each(function(index, el) {
        var currentTime = getDate();
        var time = getTimeIn24HrsFromat($(el).attr('data-time')) ;
        var startTime = new Date(currentTime.setHours(parseInt(time)));
        auditTask($(el),startTime);
    });
  }, ((1000 * 60) * 30));

// To Load the init function
onLoad();