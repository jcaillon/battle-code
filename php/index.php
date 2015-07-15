<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta name="description" content="Battle?!">
    <meta name="author" content="Julien C.">

    <base href="<?php echo "http://" . $_SERVER['SERVER_NAME'] . "/" .dirname(str_replace($_SERVER['DOCUMENT_ROOT'], '', $_SERVER['SCRIPT_FILENAME'])); ?>/">

    <link rel="icon" href="../content/main_img/bart.ico">

    <title>Battle code</title>

    <!-- Core CSS
            ================================================== -->
    <link href="../frameworks/bootstrap-3.3.4/css/bootstrap.min.css" rel="stylesheet">
    <link href="../frameworks/font-awesome-4.3.0/css/font-awesome.min.css" rel="stylesheet">

    <!-- Extra CSS
            ================================================== -->
    <link href="../css/bootstrapTheme.css" rel="stylesheet">
    <link href="../css/mainLayout.css" rel="stylesheet">

    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
</head>

<body>

<!-- NAVBAR -->
<!-- NAVIGATION -->
<nav class="navbar navbar-default navbar-fixed-top" role="navigation">
    <div class="container">

        <!-- Brand and toggle get grouped for better mobile display -->
        <div class="navbar-header">
            <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                <span class="sr-only">Toggle navigation</span> <span class="icon-bar"></span> <span class="icon-bar"></span> <span
                    class="icon-bar"></span>
            </button>
            <a class="navbar-brand" href="#"><span class="glyphicon glyphicon-home" aria-hidden="true"></span></a>
        </div>

        <!-- Collect the nav links, forms, and other content for toggling -->
        <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">

            <!-- 			MENU PRINCIPAL -->
            <ul class="nav navbar-nav">
                <li><a id="idHowTo" href="#" role="button">How To</a></li>
            </ul>
        </div>
        <!-- /.navbar-collapse -->
    </div>
    <!-- /.container -->
</nav>


<!-- PAGE CONTENT -->
<div class="container">

    <!-- PAGE BODY -->
    <div class="bodycontent">
        <?php
            include_once("views/howTo.php");
        ?>
    </div>

</div>


<!-- FOOTER -->
<footer class="footer">
    <div class="container">
        <div class="pull-left">
            <p class="text-muted">
                <small>Copyright &copy; 2015 - All Rights <small>Not</small> Reserved <small>at all</small>.</small>
            </p>
        </div>
        <!-- 		<div class="clearfix">&nbsp;</div> -->
        <div class="pull-right">
            <ul class="list-inline">
                <li><a href="#" class="label label-danger">À propos</a></li>
            </ul>
        </div>
    </div>
</footer>


<!-- Core JavaScript
================================================== -->
<script src="../frameworks/jquery-2.1.3/jquery-2.1.3.min.js"></script>
<script src="../frameworks/bootstrap-3.3.4/js/bootstrap.min.js"></script>

<!-- Extra JavaScript
================================================== -->

</body>
</html>
