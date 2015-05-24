/**
 * TableUtil, jQuery Plugin
 *
 * This plugin provides a utility to lock a columnt in a table.
 *
 * Copyright (c) 2015 "sam" Seyed Ahmad Mousavi (sam683@gmail.com)
 * Dual licensed under the MIT and GPL licenses.
 * @version 1.0.0
 */

$.widget('ns.TableUtil', {
    options: {
        width: '900px',
        height: '500px'
    },
    //private variables
    _variables: {
        originalLeft: '0px',
        xMousePos: 0,
        yMousePos: 0,
        lastScrolledLeft: 0,
        lastScrolledTop: 0,
        originalContent: '',
        thWidths: [],
        lockedColumnId: '#lockedColumn',
        lockedRowId: '#lockedRow'
    },
    _create: function () {
        var that = this;
        this._addDomPrototypes();

        //Get the widths of th elements
        var ths = this.element.find('th');
        $.each(ths, function (k, v) {
            that._variables.thWidths[k] = $(v).width();
        });

        this._variables.originalContent = this.element.html();
        this.element.wrap('<div class="mainWrapper"><div class="TableUtil tblContailer"></div></div>');
        var parent = this.element.parent();
        parent.css('width', this.options.width);
        parent.css('height', this.options.height);
        this._extractHeader();
        this._bindUiActions();
    },
    _setOption: function (k, v) {
        this._referesh();
    },
    _setOptions: function (options) {
        this._super(options);
        this._referesh();
    },
    destroy: function () {
        this.element.unwrap('<div class="mainWrapper"><div class="TableUtil tblContailer"></div></div>');
        this.element.unwrap('<div class="mainWrapper"></div>');
        $(this._variables.lockedColumnId).remove();
        $(this._variables.lockedRowId).remove();
        this.element.html(this._variables.originalContent);
        this.element.css('padding-left', '0px');
        $(this._variables.lockedRowId).css('padding-left', '0px');
        this._super('destroy');
        console.log('plugin is destroyed.');

    },
    //Todo. control needs to get refereshed.
    _referesh: function () {

    },
    _extractHeader: function () {
        var headers = this.element.find('th');
        var that = this;
        $.each(headers, function (k, v) {
            $(v).html('<div style="width:{0}px" class="btnHeader" ><a href="javascript:void(0);" class="unselectable">{1}</a></div>'.format(that._variables.thWidths[k], $(v).text()));
        });
        this.element.parent().prepend('<div id="lockedRow" style="position:absolute"><table id="tblfixedHeader"><tbody>{0}</tbody></table></div>'.format($(headers).parent().html()));
    },
    _addDomPrototypes: function () {
        //--------------------------------------------- <DOM prototypes>
        $(document).ready(function () {
            //String Format prototype
            if (!String.prototype.format) {
                String.prototype.format = function () {
                    var args = arguments;
                    return this.replace(/{(\d+)}/g, function (match, number) {
                        return typeof args[number] != 'undefined' ? args[number] : match;
                    });
                };
            }
        });
        //--------------------------------------------- </DOM prototypes>
    },
    _bindUiActions: function () {
        var that = this;
        //unbind first
        $(document).off('mousemove');
        $(this.element.parent()).off('scroll');
        $('#tblfixedHeader').off('click');
        $('tr:has(td)').off('click');
        $('#tblfixedHeader div.btnHeader').unbind();
        $('.btn.lock').unbind();
        var allCells = this.element.find("td, th");
        $(allCells).unbind();

        $(document).mousemove(function (event) {
            that._captureMousePosition(event);
            $(that._variables.lockedColumnId).css('left', '{0}px'.format(that._variables.lastScrolledLeft));
        });

        var parent = this.element.parent();
        parent.scroll(function (event) {

            if (that._variables.lastScrolledLeft != parent.scrollLeft()) {
                that._variables.xMousePos -= that._variables.lastScrolledLeft;
                that._variables.lastScrolledLeft = parent.scrollLeft();
                that._variables.xMousePos += that._variables.lastScrolledLeft;
                $(that._variables.lockedColumnId).css('left', '{0}px'.format(that._variables.lastScrolledLeft));
                $('#barTitle').css('left', '{0}px'.format(3));
                $('#barTitle').css('top', '{0}px'.format(that._variables.lastScrolledTop + 2));
            }

            if (that._variables.lastScrolledTop != parent.scrollTop()) {
                that._variables.yMousePos -= that._variables.lastScrolledTop;
                that._variables.lastScrolledTop = parent.scrollTop();
                that._variables.yMousePos += that._variables.lastScrolledTop;
                $(that._variables.lockedRowId).css('top', '{0}px'.format(that._variables.lastScrolledTop));
                $('#barTitle').css('top', '{0}px'.format(that._variables.lastScrolledTop + 2));
            }
        });

        $("tr:has(td)").click(function () {
            $("table tr").removeClass('selectedGridRow');
            $('table tr:nth-child(' + ($(this).index() + 1) + ')').addClass('selectedGridRow');
        });

        //Header buttons
        $('#tblfixedHeader div.btnHeader').on('click', function () {
            var index = $('#tblfixedHeader div.btnHeader').index(this);
            that._lock($(this).width(), $(this).offset().left, index);
        });

        //Hover effect
        allCells.on("mouseover", function () {
            var el = $(this),
                pos = el.index();
            el.parent().find("th, td").addClass("hover");
            //allCells.filter(":nth-child(" + (pos + 1) + ")").addClass("hover");
        }).on("mouseout", function () {
            allCells.removeClass("hover");
        });

        //unlock button
        $('.btn.lock').on('click', function () {
            that._unLock();
        });

    },
    _captureMousePosition: function (event) {
        this._variables.xMousePos = event.pageX;
        this._variables.yMousePos = event.pageY;
    },
    _lock: function (w, l, index) {
        var that = this;
        if (w) {

            $(this._variables.lockedColumnId).remove();
            var container = this.element.parent();
            var fixedcolumnHeight = container.scrollTop(this.element).get(0).scrollHeight;
            var fixedcolumn = '<div id="lockedColumn" style=" width: {0}px; height:{1}px; position:absolute; top=0; left:0" class="bar"> <div id="singleColumnTable"></div> </div>'.format(w, fixedcolumnHeight);
            this.element.css('padding-left', w + 13 + 'px');
            $(that._variables.lockedRowId).css('padding-left', w + 13 + 'px');

            var clonedGrid = this.element.clone();
            var actualTrs = this.element.find('tr');
            container.prepend(fixedcolumn);


            $(this._variables.lockedColumnId).css('width', w + 10 + 'px');

            var _heights = [];
            var _tempMax = 0;
            for (var i = 0; i < actualTrs.length; i++) {
                var actTds = $(actualTrs[i]).find('td');
                _tempMax = $(actualTrs[i]).outerHeight();
                for (var j = 0; j < actTds.length; j++) {
                    var _h = $(actTds[j]).outerHeight();
                    var _w = $(actTds[j]).width();
                    _tempMax = (_h > _tempMax ? _h : _tempMax);
                }
                _heights.push(_tempMax);
            }

            var trs = $(clonedGrid).find('tr');
            $.each($(trs[0]).find('th'), function (k, v) { if (k != index) { $(v).remove(); } });
            $.each(trs, function (k, v) { $(v).css('height', _heights[k] + 'px'); var tds = $(v).find('td'); $.each(tds, function (k1, v1) { if (k1 != index) { $(v1).remove(); } }); });
            $(clonedGrid).find('table').css('width', w + 18 + 'px');
            $(clonedGrid).find('div.btnHeader').removeClass('btnHeader');

            var selectedHeader = $(clonedGrid).find('th').text();
            $(clonedGrid).find('th').remove();
            $('#singleColumnTable').html('<table>{0}</table>'.format($(clonedGrid).html()));
            $('#singleColumnTable').prepend('<div id="barTitle" style="top:2px; left:3px; width:{0}px" class="">{1}</div>'.format(w + 1, selectedHeader));

            //Lock btn
            this.element.parent().parent().prepend('<div class= "btn lock"><img src = "../images/lock.png" /></div>');
            $('.btn.lock').css('left', '0px');
            $('.btn.lock').css('top', '0px');

            this._bindUiActions();
            setTimeout(function () {
                $('#barTitle').css('left', '{0}px'.format(3));
                $('#barTitle').css('top', '{0}px'.format(that._variables.lastScrolledTop + 2));
            }, 10);
        }
    },
    _unLock: function () {
        $('.btn.lock').remove();
        $(this._variables.lockedColumnId).remove();
        this.element.css('padding-left', '0px');
        this.element.css('margin-left', '0px');
        $(this._variables.lockedRowId).css('left', '0px');
        $(this._variables.lockedRowId).css('padding-left', '0px');
    }
});