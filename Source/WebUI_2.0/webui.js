"don't use strict";

/*
 *
 * Viewer scripts
 *
 */

function toggleNav()
{
    var x = document.getElementById('navigator');
    var s = window.getComputedStyle(x, null);
    if (s.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
}

function toggleFooter()
{
    var x = document.querySelector('footer');
    var s = window.getComputedStyle(x, null);
    if (s.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
}

function toggleInspector()
{
    var x = document.getElementById('widget_inspector');
    var s = window.getComputedStyle(x, null);
    if (s.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
}

function toggleSystem()
{
    var x = document.getElementById('system_inspector');
    var s = window.getComputedStyle(x, null);
    if (s.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
}


/*
 *
 * Navigator scripts
 *
 */

nav = {

    init: function (g) {
        nav.group = g;
        nav.navigator = document.getElementById('navigator');
        nav.populate(nav.navigator);
        nav.navigator.addEventListener("click", nav.navClick, false);
    },
    buildList: function(group, name) {
        var s = "<li data-name='"+name+"/"+group.name+"'>" + group.name; // or title

        if(group.views)
        {
            s +=  "<ul>"
            for(i in group.views)
                s += "<li data-name='"+name+"/"+group.name+"#"+group.views[i].name+"'>#" + group.views[i].name + "</li>";
            s += "</ul>";
        }

        if(group.groups)
        {
            s +=  "<ul>"
            for(i in group.groups)
                s += nav.buildList(group.groups[i], name+"/"+group.name);
            s += "</ul>";
        }

        s += "</li>";

        return s;
    },
    populate: function (element) {
        element.innerHTML = "<ul>"+nav.buildList(nav.group, "")+"</ul>";
    },
    navClick: function(e) {
        if (e.target !== e.currentTarget)
        {
//            console.log(e.target.getAttribute("data-name"));
            interaction.addView(e.target.getAttribute("data-name"));
        }
        e.stopPropagation();
    }
}


/*
 *
 * Inspector scripts
 *
 */
inspector = {
    inspector: null,
    table: null,
    list: null,
    webui_object: null,
    
    init: function () {
        inspector.inspector = document.getElementById('widget_inspector');
        inspector.table = document.getElementById('i_table');
    },
    remove: function () {
        while(inspector.table.rows.length)
            inspector.table.deleteRow(-1);
    },
    add: function (webui_object) {
        let widget = webui_object.widget;
        let parameters = widget.parameters;

        inspector.webui_object = webui_object;
        inspector.parameter_template = widget.parameter_template;

        for(let p of inspector.parameter_template)
        {
            let row = inspector.table.insertRow(-1);
            let value = parameters[p.name];
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            cell1.innerText = p.name;
            cell2.innerHTML = value;
            cell2.setAttribute('class', p.type);
            switch(p.control)
            {
                case 'header':
                    cell1.setAttribute("colspan", 2);
                    cell1.setAttribute("class", "header");
                    row.deleteCell(1);
                    break;

                case 'textedit':
                    cell2.contentEditable = true;
                    cell2.className += ' textedit';
                    cell2.addEventListener("keypress", function(evt) {
                        if(evt.keyCode == 13)
                        {
                            evt.target.blur();
                            evt.preventDefault();
                            return;
                        }
                        if(p.type == 'int' && (evt.key < "0" || evt.key > "9"))
                            evt.preventDefault();
                        else if(p.type == 'float' && evt.key == "." && evt.target.innerHTML.indexOf(".") != -1)
                            evt.preventDefault();
                        else if(p.type == 'float' &&  (evt.key < "0" || evt.key > "9"))
                            evt.preventDefault();
                        else if(p.type == 'source' && "abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVXYZ-_.0123456789".indexOf(evt.key) == -1)
                            evt.preventDefault();
                    });
                    cell2.addEventListener("blur", function(evt) {
                        if(p.type == 'int')
                            parameters[p.name] = parseInt(evt.target.innerText);
                        else if(p.type == 'float')
                            parameters[p.name] = parseFloat(evt.target.innerText);
                        else
                        {
                            parameters[p.name] = evt.target.innerText;
                            if(p.name == "style")
                                widget.updateStyle(widget, evt.target.innerText);
                            if(p.name == "frame-style")
                                widget.updateStyle(webui_object, evt.target.innerText);
                         }
                        widget.updateAll();
                    });
                break;

                case 'slider':
                    if(p.type == 'int' || p.type == 'float')
                    {
                        cell2.innerHTML= '<div>'+value+'</div><input type="range" value="'+value+'" min="'+p.min+'" max="'+p.max+'" step="'+(p.type == 'int' ?  1: 0.01)+'"/>';
                        cell2.addEventListener("input", function(evt) {
                            evt.target.parentElement.querySelector('div').innerText = evt.target.value;
                            parameters[p.name] = evt.target.value;
                            widget.updateAll();
                        });
                    }
                break;
                
                case 'menu':
                    var opts = p.values.split(',');
                    var s = '<select name="'+p.name+'">';
                    for(var j in opts)
                    {
                        let value = p.type == 'int' ? j : opts[j];
                        if(opts[j] == parameters[p.name])
                            s += '<option value="'+value+'" selected >'+opts[j]+'</option>';
                        else
                            s += '<option value="'+value+'">'+opts[j]+'</option>';
                    }
                    s += '</select>';
                    cell2.innerHTML= s;
                    cell2.addEventListener("input", function(evt) { parameters[p.name] = evt.target.value; widget.updateAll();});
                break;
                
                case 'checkbox':
                    if(p.type == 'bool')
                    {
                       if(value)
                            cell2.innerHTML= '<input type="checkbox" checked />';
                        else
                            cell2.innerHTML= '<input type="checkbox" />';
                        cell2.addEventListener("change", function(evt) { parameters[p.name] = evt.target.checked; widget.updateAll();});
                    }
                break;
                
                case 'number':
                    if(p.type == 'int')
                    {
                        cell2.innerHTML= '<input type="number" value="'+value+'" min="'+p.min+'" max="'+p.max+'"/>';
                        cell2.addEventListener("input", function(evt) { parameters[p.name] = evt.target.value; widget.updateAll();});
                    }
                break;
                
                default:
                
                break;
            }
        }
    },
    select: function (obj)
    {
        inspector.remove();
        inspector.add(obj);
    },
    update: function (attr_value)
    {
        // New data from server
    },
    change: function (attr_value)
    {
        // Send changed value to server
    }
}


webui_widgets = {
    constructors: {},
    add: function(element_name, class_object) {
        customElements.define(element_name, class_object);
        webui_widgets.constructors[element_name] = class_object;
    }
};


/*
 *
 * Interaction scripts for Main Area
 *
 */

interaction = {
    initialMouseX: undefined,
    initialMouseY: undefined,
    startX: undefined,
    startY: undefined,
    selectedObject: undefined,
    grid_spacing: 20,
    sizegrid: 20,
    editMode: true,
    main: undefined,
    currentView: undefined,
    currentViewName: undefined,
    widget_inspector: undefined,
    system_inspector: undefined,
    edit_inspector: undefined,
    
    init: function () {
        interaction.main = document.querySelector('main');

        interaction.widget_inspector = document.querySelector('#widget_inspector');
        interaction.system_inspector = document.querySelector('#system_inspector');
        interaction.edit_inspector = document.querySelector('#edit_inspector');

        interaction.setMode('run');
    },
    stopEvents: function (e) {
        if(interaction.main.dataset.mode == "edit") e.stopPropagation()
    },
    initElement: function (element) {   // For interactively created object
        console.log("initElement:", element);

//        if (typeof element == 'string')
//            element = document.getElementById(element);

        element.addEventListener('mousedown', interaction.startDrag, true); //capture

        let widget_select = document.querySelector('#widget_select');
        let widget_name = widget_select.options[widget_select.selectedIndex].value;
        let constr = webui_widgets.constructors[widget_name];
        if(!constr)
        {
            alert("Internal Error: No constructor found for "+widget_name);
            return;
        }
        element.widget = new webui_widgets.constructors[widget_name];
        element.widget.parameters['class'] = widget_name;
        element.widget.element = element;
        element.appendChild(element.widget);
        element.widget.init();
        element.widget.updateAll();

        // TODO: Add default data field to view data structure **********

        let widgetStyles = window.getComputedStyle(element.widget);
        let x = widgetStyles.getPropertyValue('--x');
        let y = widgetStyles.getPropertyValue('--y');
        let width = widgetStyles.getPropertyValue('--width');
        let height = widgetStyles.getPropertyValue('--height');

        element.widget.parameters['x'] = x ? x : 20;
        element.widget.parameters['y'] = y ? y : 20;
        element.widget.parameters['width'] = width ? width : 100;
        element.widget.parameters['height'] = height ? height : 100;

        element.style.top = element.widget.parameters['y']+"px";
        element.style.left = element.widget.parameters['x']+"px";
        element.style.width = element.widget.parameters['width']+"px";
        element.style.height = element.widget.parameters['height']+"px";

        element.handle = document.createElement("div");
        element.handle.setAttribute("class", "handle");
        element.handle.onmousedown = interaction.startResize;
        element.appendChild(element.handle);
    },
    initViewElement: function (element, data) {   // For object in view from IKC file
//        console.log("initViewElement:", "webui-widget-"+data['class']);

        element.addEventListener('mousedown', interaction.startDrag, true); // capture

        let constr = webui_widgets.constructors["webui-widget-"+data['class']];
        if(!constr)
        {
            console.log("Internal Error: No constructor found for "+"webui-widget-"+data['class']);
            element.widget = new webui_widgets.constructors['webui-widget-text'];
            element.widget.element = element;
            element.widget.parameters['text'] = "\""+"webui-widget-"+data['class']+"\" not found.";
        }
        else
        {
            element.widget = new webui_widgets.constructors["webui-widget-"+data['class']];
            
            // Add default parameters from CSS - possibly...
 
            for(k in element.widget.parameters)
                if(data[k] === undefined)
                    data[k] = element.widget.parameters[k];
            
            element.widget.parameters = data;
        }

        element.widget.setAttribute('class', 'widget');
        element.appendChild(element.widget);    // must append before next section

        // Section below should not exists - probably...
/*
        let widgetStyles = window.getComputedStyle(element.widget);
        let x = widgetStyles.getPropertyValue('--x');
        let y = widgetStyles.getPropertyValue('--y');
        let width = widgetStyles.getPropertyValue('--width');
        let height = widgetStyles.getPropertyValue('--height');

        x = data['x'] ? data['x'] : x;
        y = data['y'] ? data['y'] : y;
        width = data['width'] ? data['width'] : width;
        height = data['height'] ? data['height'] : height;
*/

        element.style.top = data.y+"px";
        element.style.left = data.x+"px";
        element.style.width = data.width+"px";
        element.style.height = data.height+"px";

        element.handle = document.createElement("div");
        element.handle.setAttribute("class", "handle");
        element.handle.onmousedown = interaction.startResize;
        element.appendChild(element.handle);
        
        element.widget.updateAll();
    },
    initDraggables: function () { // only needed if there are already frame elements in the main view
        let nodes = document.querySelectorAll(".frame");
        for (var i = 0; i <    nodes.length; i++)
            interaction.initElement(nodes[i]);
        let  main = document.querySelector('main');
        main.addEventListener('mousedown',interaction.deselectObject,false);
    },
    removeAllObjects() {
        let main = document.querySelector('main');
        let nodes = document.querySelectorAll(".frame");
        for (var i = 0; i < nodes.length; i++)
            main.removeChild(nodes[i]);
    },
    generateGrid: function (spacing) {
        interaction.grid_spacing = spacing;
        let grid = interaction.main.querySelector('#grid');
        if(grid)
            interaction.main.removeChild(grid);
        interaction.main.innerHTML += '<div id="grid"></div>'
        grid = document.getElementById('grid');
        for(let i=1; i<250; i++)
        {
            grid.innerHTML += '<div class="vgrid" style="left:'+i*interaction.grid_spacing+'px"></div>'
            grid.innerHTML += '<div class="hgrid" style="top:'+i*interaction.grid_spacing+'px"></div>'
        }
    },
    changeGrid: function(spacing) {
        interaction.grid_spacing = spacing;
        vgrids = document.querySelectorAll('.vgrid');
        for(let i = 0; i <    vgrids.length; i++)
            vgrids[i].style.left = ""+(i+1)*spacing+"px";
        hgrids = document.querySelectorAll('.hgrid');
        for(let i = 0; i <    hgrids.length; i++)
            hgrids[i].style.top = ""+(i+1)*spacing+"px";
    },
    increaseGrid() {
        if(interaction.grid_spacing < 160)
            interaction.changeGrid(2*interaction.grid_spacing);
    },
    decreaseGrid() {
        if(interaction.grid_spacing > 10)
            interaction.changeGrid(0.5*interaction.grid_spacing);
    },
    addObject() {
        let main = document.querySelector('main');
        let newObject = document.createElement("div");
        newObject.setAttribute("class", "frame");
        interaction.main.appendChild(newObject);
        interaction.initElement(newObject);
        interaction.currentView.objects.push(newObject.widget.parameters);
        interaction.selectObject(newObject);
    },
    addView(viewName) {
        interaction.deselectObject();
        interaction.currentViewName = viewName;
        interaction.currentView = controller.views[viewName];
        interaction.removeAllObjects();

        let main = document.querySelector('main');
        let v = interaction.currentView.objects;
        for(let i=0; i<v.length; i++)
        {
            let newObject = document.createElement("div");
            newObject.setAttribute("class", "frame visible");
            
            let newTitle = document.createElement("div");
            newTitle.setAttribute("class", "title");
            newTitle.innerHTML = "TITLE";
            newObject.appendChild(newTitle);
            
            interaction.main.appendChild(newObject);
            interaction.initViewElement(newObject, v[i])
        }
    },
    deselectObject() {
        if(interaction.selectedObject)
        {
            interaction.selectedObject.className = interaction.selectedObject.className.replace(/selected/,'');
            interaction.selectedObject.className = interaction.selectedObject.className.replace(/dragged/,'');
            interaction.selectedObject.className = interaction.selectedObject.className.replace(/resized/,'');
            interaction.releaseElement();
            interaction.selectedObject = null;
            //document.getElementById('selected').innerText = ""

            interaction.widget_inspector.style.display = "none";
//            interaction.system_inspector.style.display = "none";
            interaction.edit_inspector.style.display = "block";
        }
    },
    releaseElement: function(evt) {
        interaction.main.removeEventListener('mousemove',interaction.move,true);
        interaction.main.removeEventListener('mousemove',interaction.resize,true);
        interaction.main.removeEventListener('mouseup',interaction.releaseElement,true);
//        if(interaction.selectedObject)
        {
            interaction.selectedObject.className = interaction.selectedObject.className.replace(/dragged/,'');
            interaction.selectedObject.className = interaction.selectedObject.className.replace(/resized/,'');
        }
        if(evt) evt.stopPropagation()
    },
    selectObject: function(obj) {
        interaction.deselectObject()
        interaction.selectedObject = obj;
        interaction.selectedObject.className += ' selected';
        //document.querySelector('#selected').innerText = interaction.selectedObject.dataset.name;
        
        inspector.select(obj);
        
        interaction.widget_inspector.style.display = "block";
 //       interaction.system_inspector.style.display = "none";
        interaction.edit_inspector.style.display = "none";

    },
    startDrag: function (evt) {
        // do nothing in run mode
        if(interaction.main.dataset.mode == "run")
            return;
        
        // continue propagation if in resize handle
        let r = this.handle.getBoundingClientRect();
        if( r.left < evt.clientX && evt.clientX < r.right &&
            r.top  < evt.clientY && evt.clientY < r.bottom)
            return;
        
        // handle the drag
        
        evt.stopPropagation();
        interaction.startX = this.offsetLeft;
        interaction.startY = this.offsetTop;
        interaction.selectObject(this);
        interaction.selectedObject.className += ' dragged';
        interaction.initialMouseX = evt.clientX;
        interaction.initialMouseY = evt.clientY;
        interaction.main.addEventListener('mousemove',interaction.move, true);
        interaction.main.addEventListener('mouseup',interaction.releaseElement,true);
        return false;
    },
    move: function (evt) {
        evt.stopPropagation()
        let dX = evt.clientX - interaction.initialMouseX;
        let dY = evt.clientY - interaction.initialMouseY;
        interaction.setPosition(dX,dY);
        return false;
    },
    startResize: function (evt) {
        evt.stopPropagation();
        interaction.startX = this.offsetLeft;
        interaction.startY = this.offsetTop;
        interaction.selectObject(this.parentElement);
        interaction.selectedObject.className += ' resized';
        interaction.initialMouseX = evt.clientX;
        interaction.initialMouseY = evt.clientY;
        interaction.main.addEventListener('mousemove',interaction.resize,true);
        interaction.main.addEventListener('mouseup',interaction.releaseElement,true);
        return false;
    },
    resize: function (evt) {
        let dX = evt.clientX - interaction.initialMouseX;
        let dY = evt.clientY - interaction.initialMouseY;
        interaction.setSize(dX,dY);
        return false;
    },
    setPosition: function (dx, dy) {
        let newLeft = interaction.grid_spacing*Math.round((interaction.startX + dx)/interaction.grid_spacing);
        let newTop = interaction.grid_spacing*Math.round((interaction.startY + dy)/interaction.grid_spacing);
        interaction.selectedObject.style.left = newLeft + 'px';
        interaction.selectedObject.style.top = newTop + 'px';
  
        // Update view data
//        console.log(interaction.selectedObject.parameters);
        interaction.selectedObject.widget.parameters['x'] = newLeft;
        interaction.selectedObject.widget.parameters['y'] = newTop;
    },
    setSize: function (dx, dy) {
        let newWidth = interaction.sizegrid*Math.round((interaction.startX + dx)/interaction.sizegrid)+1;
        let newHeight = interaction.sizegrid*Math.round((interaction.startY + dy)/interaction.sizegrid)+1;
        interaction.selectedObject.style.width = newWidth + 'px';
        interaction.selectedObject.style.height = newHeight + 'px';
        
        // Update view data
        interaction.selectedObject.widget.parameters['width'] = newWidth;
        interaction.selectedObject.widget.parameters['height'] = newHeight;
        
        interaction.selectedObject.widget.updateAll(); //***************
    },
    setMode: function(mode) {
        interaction.deselectObject();
        let main = document.querySelector('main');
        main.dataset.mode = mode;
        
        if(main.dataset.mode == "edit")
        {
            interaction.widget_inspector.style.display = "none";
        //    interaction.system_inspector.style.display = "none";
            interaction.edit_inspector.style.display = "block";
            interaction.main.addEventListener('mousemove', interaction.stopEvents, true);
            interaction.main.addEventListener('mouseout', interaction.stopEvents, true);
            interaction.main.addEventListener('mouseover', interaction.stopEvents, true);
           interaction.main.addEventListener('click', interaction.stopEvents, true);
        }
        else if(main.dataset.mode == "run")
        {
            interaction.widget_inspector.style.display = "none";
        //    interaction.system_inspector.style.display = "block";
            interaction.edit_inspector.style.display = "none";

            interaction.main.removeEventListener('mousemove', interaction.stopEvents, true);
            interaction.main.removeEventListener('mouseout', interaction.stopEvents, true);
            interaction.main.removeEventListener('mouseover', interaction.stopEvents, true);
            interaction.main.removeEventListener('click', interaction.stopEvents, true);
        }
    },
    toggleEditMode: function() {
        interaction.edit_mode = ! interaction.edit_mode;
        if(interaction.edit_mode)
            interaction.setMode("edit")
        else
            interaction.setMode("run");
    }
}

/*
 *
 * Controller Scripts
 *
 */

controller = {
    run_mode: 'realtime',
    tick: 0,
    session_id: 0,
    views: {},
    
/*
    updateProgress: function (oEvent)
    {
        if (oEvent.lengthComputable)
        {
            var percentComplete = oEvent.loaded / oEvent.total;
            console.log("Progress: ", 100*percentComplete, "% complete");
            document.querySelector("progress").setAttribute("value", 100*percentComplete);
        }
        else
        {
            // Unable to compute progress information since the total size is unknown
             console.log("Progress: ", oEvent.loaded);
       }
    },

    transferComplete: function (evt) {
        console.log("The transfer is complete.");
    },

    transferFailed: function (evt) {
        console.log("An error occurred while transferring the file.");
    },

    transferCanceled: function (evt) {
        console.log("The transfer has been canceled by the user.");
    },
*/
    get: function (url, callback)
    {
        var last_request = url;
 //       console.log("SENDING GET:"+url);
        
        xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);

        xhr.onloadstart = function(evt)
        {
            document.querySelector("progress").setAttribute("value", 0);
        }

        xhr.onprogress = function(evt)
        {
            if (evt.lengthComputable)
            {
                var percentComplete = evt.loaded / evt.total;
//                console.log("Progress: "+parseInt(100*percentComplete)+"% complete");
                document.querySelector("progress").setAttribute("value", 100*percentComplete);
            }
        }
        xhr.onerror = function(evt)
        {
            console.log("onerror");
//            console.log(evt);
            if(evt.lengthComputable && evt.loaded < evt.total)
                console.log("Failed to load resource. Incomplete.");
            else if(evt.total == 0 )
                console.log("Failed to load resource. No data.");
            else
                console.log("Failed to load resource.");
 
//            console.log("Resending request");
//            controller.get(last_request, controller.update);
       }
        xhr.ontimeout = function(evt)
        {
            console.log("Timeout - resending request");
//            console.log(evt);
            
            // Resend request
            
//            controller.get(last_request, controller.update);
        }
        xhr.onload = function(evt)
        {
            if(!xhr.response)   // empty response is ignored
                return;

    //        console.log("The transfer is complete.");
    //        console.log(xhr.response);
            callback(xhr.response, xhr.getResponseHeader("Session-Id"));
        }
        
        xhr.responseType = 'json';
        xhr.timeout = 1000;
        xhr.send();
    },

    init: function () {
        controller.get("update.json", controller.update);
        setInterval(function() {controller.requestUpdate();}, 100); // Use adaptive frequency later
    },
    
    stop: function () {
        controller.get("stop", controller.update);
    },
    
    pause: function () {
        controller.get("pause", controller.update);
    },
    
    step: function () {
        controller.get("step", controller.update);
    },
    
    play: function () {
        controller.get("play", controller.update);
    },
    
    realtime: function () {
        controller.get("realtime", controller.update);
    },

    buildViewDictionary: function(group, name) {
        if(group.views)
            for(i in group.views)
                controller.views[name+"/"+group.name+"#"+group.views[i].name] = group.views[i];

        if(group.groups)
            for(i in group.groups)
                controller.buildViewDictionary(group.groups[i], name+"/"+group.name);
    },

    selectView: function(view) {
 //       console.log(view);
 //       console.log(controller.views[view]);

        // Create new view if it does not exist
        
        interaction.addView(view);
    },

    update(response, session_id)
    {
        // Check if this is a new session
        
        if(controller.session_id != session_id) // new session
        {
            console.log("NEW SESSION "+session_id);
            controller.session_id = session_id;
            nav.init(response);
            controller.buildViewDictionary(response, "");
            controller.selectView(Object.keys(controller.views)[0]);
            controller.get("update.json", controller.update);
        }
        else // same session - proably new data package
        {
//            console.log("SAME SESSION "+session_id);
            
            e = document.querySelector("#iteration");
            e.innerText = response.iteration;
            
            // Update the views with data in response
            // Very fragile loop - maybe use class to mark widgets or something
            let w = document.getElementsByClassName('frame')
            for(let i=0; i<w.length; i++)
                try
                {
                    w[i].children[1].update(response);
                }
                catch(err)
                {}
        }
    },

    requestUpdate: function()
    {
        if(!interaction.currentView) // no view selected
        {
            controller.get("update.json", controller.update);
            return;
        }

        // Request new data
        
        let data_set = new Set();
        
        // Very fragile loop - maybe use class to mark widgets or something
        let w = document.getElementsByClassName('frame')
        for(let i=0; i<w.length; i++)
            try
            {
                w[i].children[1].requestData(data_set);
            }
            catch(err)
            {}

        let data_string = ""
        
        let sep = "";
        for(s of data_set)
        {
            data_string += (sep + s);
            sep = "+"
         }
        
        controller.get("update.json?data="+encodeURIComponent(data_string), controller.update);
    }
}

