var CodeLearner = CodeLearner || {};

jQuery(function ($) {

    "use strict";

    CodeLearner.CreateProblem = {
        init: function () {
            this.problem;
            this.problemClass = '';
            this.problemId = '';
            this.problemDetails;
            this.user= '';
            this.role = '';
            this.render();
        },

        render: function () {
            this.cacheElements();
            this.bindEvents();
            this.user = $('#userId').text().trim();
            this.role = $('#userRole').text().trim()
            if (this.role === 'Student') {
                $('a[href="#createProblem"]').hide();
            } else {
                $('a[href="#createProblem"]').show();
            }
        },

        cacheElements: function () {
            this.mainContainer = $('.main-container');
            this.anotherMainContainer = $('.another-main-container');

            //Templates
            this.problemDetailsTemplate = Handlebars.compile($('#problem-details-template').html());
            this.adminProblemDetailsTemplate = Handlebars.compile($('#admin-problem-details-template').html());
            this.outputTemplate = Handlebars.compile($('#output-template').html());
        },

        bindEvents: function () {
            $("textarea").keydown(function(e) {
                if(e.keyCode === 9) { // tab was pressed
                    // get caret position/selection
                    var start = this.selectionStart;
                    var end = this.selectionEnd;

                    var $this = $(this);
                    var value = $this.val();

                    // set textarea value to: text before caret + tab + text after caret
                    $this.val(value.substring(0, start)
                        + "\t"
                        + value.substring(end));

                    // put caret at right position again (add one for the tab)
                    this.selectionStart = this.selectionEnd = start + 1;

                    // prevent the focus lose
                    e.preventDefault();
                }
            });

            this.mainContainer
                .on('blur keyup', '#className', $.proxy(this.freezeClassName, this))
                .on('click', '#code-edit-class', $.proxy(this.editClassName, this))
                .on('click', '.code-execute', $.proxy(this.executeCode, this))
                .on('cut paste keyup', '#problemCodeStart, #problemCodeEnd', $.proxy(this.disableSubmit, this))
                .on('click', '.code-submit', $.proxy(this.submitCode, this));


            this.anotherMainContainer
                .on('click', '.problem-div', $.proxy(this.fetchProblemDetails, this))
                .on('click', '.code-execute', $.proxy(this.executeCode, this))
                .on('cut paste keyup', '#problemCode', $.proxy(this.disableSubmitInView, this))
                .on('click', '.code-submit', $.proxy(this.submitCode, this));

            $('body')
                .on('click', '#signup', $.proxy(this.getRegisterPage, this))
                .on('click', '#registerUser', $.proxy(this.registerUser, this))
                .on('click', '#signin', $.proxy(this.loginUser, this))
                .on('click', '#logout', $.proxy(this.logoutUser, this))
                .on('click', 'a[href="#viewProblems"]', $.proxy(this.displaySidebar, this))
                .on('click', 'a[href="#createProblem"]', $.proxy(this.clearForm, this))
                .on('click', '#view-probs', $.proxy(function () {$('a[href="#viewProblems"]').click(); $('#successModal').modal('toggle');}, this))
                .on('click', '#create-prob', $.proxy(function () {$('a[href="#createProblem"]').click(); $('#successModal').modal('toggle');}, this))
                .on('click', '.submit-feedback', $.proxy(this.submitFeedback, this))
                .on('click', '.view-feedback', $.proxy(this.viewFeedback, this))
                .on('click', '#save-feedback', $.proxy(this.saveFeedback, this));
        },

        getRegisterPage: function () {
            window.location = "./register";
        },

        registerUser: function () {
            var that = this;
            var registerUser = {
                'userId'	: $('#userId').val(),
                'password' 	: $('#password').val(),
                'firstName'	: $('#firstName').val(),
                'lastName' 	: $('#lastName').val(),
                'role'  	: $('#selectRole option:selected').val(),
                'email'  	: $('#email').val()

            };

            that.postData(CodeLearner.Url.registerUser, registerUser)
                .complete(function (response) {
                    alert("Registration Successful");
                    window.location = "./login";
                });

        },

        loginUser: function () {
            var that = this;
            var loginUser = {
                'userId'	: $('#userId').val(),
                'password' 	: $('#password').val()
            };

            that.postData(CodeLearner.Url.login, loginUser)
                .complete(function (response) {
                    var data = JSON.parse(response.responseText);
                    if (data.status == 'success') {
                        that.user = data.userId;
                        that.role = data.role;
                        $('a[href="#createProblem"]')[data.role === 'Instructor' ? 'show' : 'hide']();
                        // $('.close-modal').click();

                        $('.problem-worksheet').addClass('hidden');
                        window.location = "./home";
                    } else {
                        alert("Invalid UserId or Password");
                    }
                });
        },

        logoutUser: function () {
            console.log('Calling modelserve')
            var predict = {
                "product_description":"Hackathon test data"
            }
            var that = this;
            that.postData("http://127.0.0.1:4999/modelserve", predict)
                .complete(function (response) {
                    var data = JSON.parse(response.responseText);
                    console.log(data); 
                });

        },

        submitFeedback: function (e) {
            var that = this;

            $('#feedback').val('').prop('disabled', false);
            $('input.star')
                .rating('select', -1)
                .rating('enable');

            $('#save-feedback').show();

            $('.star').rating({
                  focus: function(value, link){
                    var tip = $('#hover-test');
                    tip[0].data = tip[0].data || tip.html();
                    tip.html(link.title || 'value: '+value);
                  },
                  blur: function(value, link){
                    var tip = $('#hover-test');
                    $('#hover-test').html(tip[0].data || '');
                  }
                });

            $.each(that.problemDetails.answers, function (key, answer) {
                if (answer.feedback) {
                    if ($(e.target).attr('data-answer-id') === answer.problemId) {
                        $('#feedback').val(answer.feedback);
                        $('input.star').rating('select', +answer.rating - 1);
                    }
                }
            });

            $('#save-feedback').attr('data-answer-id', $(e.target).attr('data-answer-id'));
        },

        viewFeedback: function (e) {
            var that = this;
            var userId = this.user;
            $('#feedback').val('').prop('disabled', false);
            $('input.star')
                .rating('select', -1)
                .rating('enable');

            $('.star').rating({
                  focus: function(value, link){
                    var tip = $('#hover-test');
                    tip[0].data = tip[0].data || tip.html();
                    tip.html(link.title || 'value: '+value);
                  },
                  blur: function(value, link){
                    var tip = $('#hover-test');
                    $('#hover-test').html(tip[0].data || '');
                  }
                });

            $.each(that.problemDetails.answers, function (key, answer) {
                if (answer.rating && answer.rating > 0 && answer.rating <= 5 && answer.answeredBy === userId) {
                    $('#feedback').val(answer.feedback).prop('disabled', true);
                    $('input.star')
                        .rating('select', +answer.rating - 1)
                        .rating('disable');

                }
            });

            $('#save-feedback').hide();
        },

        saveFeedback: function (e) {
            var that = this,
                update = {
                    'rating': ($('.star-rating-on').length),
                    'answerId': $(e.target).attr('data-answer-id'),
                    'feedback': $('#feedback').val()
                };

            that.postData(CodeLearner.Url.saveFeedback, update)
            .complete(function (response) {
                $('.currently-selected-div').click();
            });
        },

        disableSubmit: function () {
            $('.code-execute').prop('disabled', $('#problemCodeStart').val().trim().length === 0 && $('#problemCodeEnd').val().trim().length === 0 ? true : false);
            $('.code-submit').prop('disabled', true);
        },

        disableSubmitInView: function () {
            $('.code-submit').prop('disabled', true);
        },

        clearForm: function (e) {
            var that = this;
            $('#problemCode').prop('disabled', false);
            $('#problemDescription, #problemTitle, #className, #problemCodeStart, #problemCodeEnd').val('');
            $('.problem-class-name').text('');
            $('.problem-container, .problem-control-panel').addClass('hidden');

            if (!$('#code-edit-class').hasClass('hidden')) {
                $('#code-edit-class').trigger('click');
            }
        },

        freezeClassName: function (e) {
            var that = this,
                enteredClassName = $('#className').val();

            if(e.type === 'keyup' && e.which == 13 || e.type === 'focusout') {
                if (enteredClassName.trim().length !== 0) {
                    $('.problem-class-name')
                        .removeClass('hidden').text($('#className').val())
                        .parent()
                        .find('#className').hide()
                        .parent()
                        .find('#code-edit-class').removeClass('hidden');

                    that.generateStaticCode();
                    $('.problem-container, .problem-control-panel').removeClass('hidden');
                    $('.code-submit').prop('disabled', true);
                    $('.code-execute').prop('disabled', $('#problemCodeStart').val().trim().length === 0 && $('#problemCodeEnd').val().trim().length === 0 ? true : false);
//                    $('.code-execute').prop('disabled', false);
                }
            }
        },

        editClassName: function (e) {
            var that = this;

            e.preventDefault();

            $('.problem-class-name')
                .addClass('hidden')
                .parent()
                .find('#className').show()
                .parent()
                .find('#code-edit-class').addClass('hidden');
        },

        generateStaticCode: function () {
            $('.problem-class-name-start').text('public class ' + $('.problem-class-name').text().trim() + ' {');
            $('.problem-class-name-end').text('}');
        },

        fetchProblemDetails: function (e) {
            var that = this,
                problemId,
                isDisabled = false,
                problemDetails,
                userId = that.user,
                userRole = that.role;

            $('.problem-div').removeClass('currently-selected-div');

            if (!$(e.target).hasClass('problem-div')) {
                problemId = $(e.target).closest('.problem-div').addClass('currently-selected-div').attr('data-problem-id');
            } else {
                problemId = $(e.target).addClass('currently-selected-div').attr('data-problem-id');
            }

            if (userId.length === 0) {
                return;
            }

            that.getData(CodeLearner.Url.fetchProblemDetails + problemId)
            .complete(function (response) {
                problemDetails = JSON.parse(response.responseText);
                that.problemDetails = problemDetails;
                that.problemClass = problemDetails.problem.className;
                that.problemId = problemDetails.problem.problemId;

                if (userRole === 'Instructor') {
                    $.each(problemDetails.problem.codeLines, function (key, codeline) {
                        problemDetails.problem.codeLines[key] = codeline.concat('\n');
                    });

                    $.each(problemDetails.answers, function (key1, answer) {
                        $.each(answer.codeLines, function (key2, codeline) {
                            problemDetails.answers[key1].codeLines[key2] = codeline.concat('\n');
                        });
                    });
                    $('.problem-worksheet').removeClass('hidden').html(that.adminProblemDetailsTemplate(problemDetails));
                } else {
                    $.each(problemDetails.answers, function (key1, answer) {
                        $.each(answer.codeLines, function (key2, codeline) {
                            problemDetails.answers[key1].codeLines[key2] = codeline.concat('\n');
                        });
                    });

                    $.each(problemDetails.problem.codeLines, function (key, codeline) {
                        problemDetails.problem.codeLines[key] = codeline.concat('\n');
                    });

                    $.each(problemDetails.answers, function (key, answer) {
                        if (answer.answeredBy === userId) {
                            problemDetails.problem.isDisabled = true;
                            problemDetails.problem.codeLines = answer.codeLines;

                            if (answer.rating && answer.rating > 0 && answer.rating <= 5) {
                                problemDetails.problem.isFeedbackAvailable = true;
                            } else {
                                problemDetails.problem.isFeedbackAvailable = false;
                            }

                        }
                    });

                    $('.problem-worksheet')
                        .removeClass('hidden').html(that.problemDetailsTemplate(problemDetails))
                        .find('.code-submit').prop('disabled', true);

                }
            });
        },

        executeCode: function (e) {
            var that = this,
                responseArray = [],
                code = [],
                dotPos,
                userId = that.user,
                userRole = that.role,
                problemClass;

            e.preventDefault();
            $('#outputModal .output-space').text('');
            that.problem = {};

            if (that.problemClass.length !== 0) {
                dotPos = that.problemClass.indexOf('.');
                problemClass = that.problemClass.substr(0, dotPos);
            }


            if($('li.active a[href="#viewProblems"]').length !== 0) {
                // Compile from Instructor's problems list
                if (userRole === 'Instructor') {
                    code = $(e.target).parent().prev().find('#problemCode').val().split('\n');

                    that.problem = {
                            'className' : problemClass,
                            'language':'Java',
                            'code': code,
                    };
                } else {
                    // Compile from Student's problems list
                    code = $('#problemCode').val().split('\n');

                    that.problem = {
                            'problemDescription' : $('.display-problem-description').val().trim(),
                            'problemTitle' : $('.display-problem-title').val().trim(),
                            'className' : problemClass,
                            'language':'Java',
                            'code': code,
                            'questionId': that.problemId,
                            'answeredBy': userId
                    };
                }
            } else if ($('li.active a[href="#createProblem"]').length !== 0) {
                //Compile from Instructor's Create Problem page
                code = code.concat($('#problemCodeStart').val().split('\n'));
                code.push($('.problem-class-name-start').text());
                code = code.concat($('#problemCodeEnd').val().split('\n'));
                code.push($('.problem-class-name-end').text());

                that.problem = {
                        'problemDescription' : $('#problemDescription').val().trim(),
                        'problemTitle' : $('#problemTitle').val().trim(),
                        'className' : $('.problem-class-name').text().trim(),
                        'language':'Java',
                        'code': code,
                        'createdBy': userId,
                };
            }

            that.postData(CodeLearner.Url.compileCode, that.problem)
            .complete(function (response) {
                responseArray = JSON.parse(response.responseText);

                if ($('#problemCode').prop('disabled') === true) {
                    $('.code-submit').prop('disabled', true);
                }else{
                    $('.code-submit').prop('disabled', !responseArray.flag);

                }

                $('.output-space').html(that.outputTemplate(responseArray.compiledOutput));
            });
        },

        submitCode: function (e) {
            var that = this;

            e.preventDefault();

            that.postData(CodeLearner.Url.submitCode, that.problem)
            .complete(function (response) {
                if ($('a[href="#viewProblems"]').parent().hasClass('active')) {
                    $('.currently-selected-div').click();
                }
            });
        },

        displaySidebar: function (e) {
            var that = this,
                url = CodeLearner.Url.fetchProblemsByLanguage;

            $('.problem-worksheet').addClass('hidden');

            this.problemsTable = $('#problemsTable').dataTable({
                'sAjaxSource' : url,
                'sAjaxDataProp' : 'problems',
                'sScrollY': '600px',
                'bFilter' : false,
                'bDestroy': true,
                'bPaginate': false,
                'bInfo': false,
                'bLengthChange': false,
                'iDisplayLength': 25,
                'oLanguage': {
                    'sZeroRecords': 'No problems available'
                },
                'aoColumns': [{
                    'mData': 'problemId',
                    'bSortable': false,
                    'mRender': function (data, type, full) {
                        return formatCell(full);
                    }
                }],
                'fnServerData': function (sSource, aoData, fnCallback) {
                    var ajaxRequest = that.getData(url, {});

                    ajaxRequest
                        .done(function (json) {
                            fnCallback(json);
                        })
                        .fail(function (jqXHR, textStatus, errorThrown) {
                        })
                        .always(function (jqXHR) {
                        });
                },
            });

            function formatCell(full) {
                return '<div class="problem-div" title="' + full.metadata.title + '" data-problem-id="' + full.problemId  + '"><p class="sidebar-title">' + full.metadata.title + '</p><p class="sidebar-desc">' + full.metadata.description + '</p></div>';
            }
        },

        postData : function (url, data, sessionId) {
            var headerMap = {
                    'Content-Type' : 'application/json',
                    'Accept' : 'application/json',
                    'IDS-SESSION-ID': sessionId
                }

            return $.ajax({
                url : url,
                type : 'POST',
                data : JSON.stringify(data),
                headers : headerMap
            });
        },
        getData : function (url, encodeResponse, params) {
            var headerMap = {
                    'Content-Type' : 'application/json',
                    'Accept' : 'application/json'
                }

            return $.ajax({
                url : url,
                type : 'GET',
                data : {},
                headers : headerMap
            });
        },
    };

    CodeLearner.CreateProblem.init();
});
