
function send_prediction_request(){

    
    pred_date = $('#prediction-date').val();
    
    pred_time = $('#prediction-time').val();
    
    // get time as integer
    now = new Date();
    midnight_time = new Date(now.getFullYear(),
                                 now.getMonth(),
                                 now.getDate(),0,0,0);
    this_time = new Date(now.getFullYear(),
                             now.getMonth(),
                             now.getDate(),pred_time.split(':')[0],pred_time.split(':')[1]);
    seconds_from_midnight = (this_time.getTime() - midnight_time.getTime())/1000.0;

    // get day as integer
    call_day = pred_date.split('-')[2] 
    // get month as integer
    call_month = pred_date.split('-')[1]
    // get day of week as integer
    day_of_week = new Date(+pred_date.split('-')[0],+pred_date.split('-')[1],+pred_date.split('-')[2],0,0,0).getDay();

    // convert to be same as in python
    day_of_week -= 1;
    if (day_of_week == -1){
        day_of_week = 6;
    } 
    // get source area code
    source_area_code=$('#source-area-code').val();
    
    // get recipient area code
    dest_area_code=$('#dest-area-code').val();

    // send request to prediction API
    data_to_send = {time:+seconds_from_midnight,
                    source_area_code: source_area_code,
                    day: +call_day,
                    month: +call_month,
                    day_of_week: +day_of_week,
                    recipient_area_code: dest_area_code};
    // do POST request
    $.post("/get-prediction", data_to_send,function(resp){
        // just log for now
        //console.log(resp);

        RefreshViz(resp);
    },'json');
}