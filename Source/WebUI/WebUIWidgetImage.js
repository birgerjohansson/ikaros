class WebUIWidgetImage extends WebUIWidgetGraph
{
    static template()
    {
        return [
            {'name': "PARAMETERS", 'control':'header'},
            {'name':'module', 'default':"", 'type':'source', 'control': 'textedit'},
            {'name':'source', 'default':"", 'type':'source', 'control': 'textedit'},
            {'name':'title', 'default':"Image", 'type':'string', 'control': 'textedit'},
            {'name':'file', 'default':"", 'type':'string', 'control': 'textedit'},
            {'name':'format', 'default':"gray", 'type':'string', 'control': 'menu', 'values': "gray,fire,spectrum,red,green,blue,rgb"},
            {'name':'scale', 'default':"both", 'type':'string', 'control': 'menu', 'values': "none,width,height,both"},
            {'name': "STYLE", 'control':'header'},
            {'name':'scales', 'default':"no", 'type':'string', 'control': 'menu', 'values': "yes,no", 'class':'true'},
            {'name':'show_title', 'default':false, 'type':'bool', 'control': 'checkbox'},
            {'name':'show_frame', 'default':false, 'type':'bool', 'control': 'checkbox'},
            {'name':'style', 'default':"", 'type':'string', 'control': 'textedit'},
            {'name':'frame-style', 'default':"", 'type':'string', 'control': 'textedit'}
        ]};

    requestData(data_set)
    {
        if(!this.parameters.file)
            data_set.add(this.parameters.module+"."+this.parameters.source+":"+this.parameters.format);
    }

    updateFrame()
    {
        this.oversampling = 1; //(this.parameters.file ? 4 : 1);
        this.imageObj = new Image();
        if(this.parameters.file)
            this.imageObj.src = "/"+this.parameters.file;
        else
        {
            this.canvas.fillStyle="black";
            this.canvas.fillRect(0, 0, this.width, this.height);
        }
        super.updateFrame();
    }

    loadData(data)
    {
        if(this.parameters.module)
        {
            var d = data[this.parameters.module];
            if(!d) return;
            d = d[this.parameters.source+':'+this.parameters.format]
            if(!d) return;
            this.imageObj.onload = function ()
            {
                controller.load_count--;
            };
            this.imageObj.src = d;
            return 1;
        }

        return 0;
    }

    drawPlotHorizontal(width, height)   // Draw actual image in a coordinate system
    {
        let w = this.oversampling*width;   // this could be done in updateFrame and stored
        let h = this.oversampling*height;
        if(this.parameters.scale == "width")
            h = this.imageObj.height;
        else if(this.parameters.scale == "height")
            w = this.imageObj.width;
        else if(this.parameters.scale == "none")
        {
            w = this.imageObj.width;
            h = this.imageObj.height;
        }
        this.canvas.drawImage(this.imageObj, 0, 0, w, h);
    }
    
    update(d)
    {
        try
        {
            this.canvas.setTransform(1, 0, 0, 1, -0.5, -0.5);
            this.canvas.clearRect(0, 0, this.width, this.height);
            this.canvas.translate(this.format.marginLeft, this.format.marginTop); //

            this.drawHorizontal(1, 1);  // Draw grid over image
        }
        catch(err)
        {
//            this.canvas.fillText(err, 0, 20);
            this.canvas.fillStyle="black";
            this.canvas.fillRect(0, 0, this.oversampling*this.width, this.oversampling*this.height);
        }
    }
};



webui_widgets.add('webui-widget-image', WebUIWidgetImage);