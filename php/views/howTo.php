<div class="page-header">
    <h1><i class="fa fa-diamond"></i> Battle Code : Unofficial Server!</h1>
</div>
<h2>Liste des commandes dispos pour la battlecode :</h2>

<div class="panel panel-info">
    <div class="panel-heading">Modifier son profil de combattant</div>
    <div class="panel-body">
Action disponible uniquement AVANT le début d'un combat (start)<br><br>
        <blockquote>
            <samp><?php echo "http://" . $_SERVER['SERVER_NAME']; ?>/battle/changeTeamProfile?<kbd>gameId</kbd>=<code>str</code>&<kbd>teamId</kbd>=<code>str</code>&<kbd>teamToken</kbd>=<code>str</code>&<kbd>profile</kbd>=<code>Tank|Normal|Assassin</code></samp>
        </blockquote>
        Code http réponse :
<pre>200 - Requête OK
500 - KO</pre>
        <table class="table table-striped">
            <thead>
            <tr>
                <th>Profile</th>
                <th>Vie</th>
                <th>Points d'action</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>Tank</td>
                <td>150</td>
                <td>5</td>
            </tr>
            <tr>
                <td>Normal</td>
                <td>100</td>
                <td>10</td>
            </tr>
            <tr>
                <td>Assassin</td>
                <td>50</td>
                <td>20</td>
            </tr>
            </tbody>
        </table>
    </div>
</div>

<div class="panel panel-info">
    <div class="panel-heading">Envoyer les actions pour le tour en cours</div>
    <div class="panel-body">
        <blockquote>
            <samp><?php echo "http://" . $_SERVER['SERVER_NAME']; ?>/battle/teamAction?<kbd>gameId</kbd>=<code>str</code>&<kbd>round</kbd>=<code>n°round</code>&<kbd>teamId</kbd>=<code>str</code>&<kbd>teamToken</kbd>=<code>str</code>&<kbd>t_&lt;teamId&gt;</kbd>=<code>nb PA</code></samp>
    </blockquote>
    Code http réponse :
<pre>200 - Requête OK
500 - KO</pre>
</div>
</div>

<!--<div class="panel panel-info">-->
<!--    <div class="panel-heading">Récupérer l'état du monde version simple</div>-->
<!--    <div class="panel-body">-->
<!--        Action disponible uniquement AVANT le début d'un combat (start)-->
<!--        <blockquote>-->
<!--            <samp>--><?php //echo "http://" . $_SERVER['SERVER_NAME']; ?><!--/battle/simpleWorldState?<kbd>gameId</kbd>=<code>str</code>&<kbd>round</kbd>=<code>n°round</code>&<kbd>teamId</kbd>=<code>str</code>&<kbd>teamToken</kbd>=<code>str</code></samp>-->
<!--        </blockquote>-->
<!--        Réponse format plain-text csv :-->
<!--        <pre>round:3;A:5;B:3;C:7</pre>-->
<!--        Au début du tour 3, l’équipe A possède encore 5 PV, l’équipe A possède encore 3 PV et l’équipe C possède encore 7 PV.-->
<!--    </div>-->
<!--</div>-->
<!---->
<!--<div class="panel panel-info">-->
<!--    <div class="panel-heading">Récupérer le log d'une battle</div>-->
<!--    <div class="panel-body">-->
<!--        <blockquote>-->
<!--            <samp>--><?php //echo "http://" . $_SERVER['SERVER_NAME']; ?><!--/battle/log?<kbd>gameId</kbd>=<code>str</code></samp>-->
<!--        </blockquote>-->
<!--        Réponse format plain-text?-->
<!--    </div>-->
<!--</div>-->

<div class="panel panel-info">
    <div class="panel-heading">Récupérer l'état détaillé du combat</div>
    <div class="panel-body">
        <blockquote>
            <samp><?php echo "http://" . $_SERVER['SERVER_NAME']; ?>/battle/worldState?<kbd>gameId</kbd>=<code>str</code>&<kbd>round</kbd>=<code>n°round</code>&<kbd>teamId</kbd>=<code>str</code>&<kbd>teamToken</kbd>=<code>str</code></samp>
        </blockquote>
        Résultat JSON :
<pre>{
   "gameId":"7-11434766",
   "gameStatus":"STARTED",
   "round":2,
   "teamIdToLifePoint":{ "XXT1":195, "XXT2":99},
   "teamIdToRoundDead":{"XXT1":0, "XXT2":0},
   "teamIdToActions":{
      "XXT1":[
         {"id":41311,  "gameId":"7-11434766", "round":2,
           "sourceTeamId":"XXT1", "targetTeamId":"XXT2",
           "nbPoint":3, "status":"REGISTERED"},
         {"id":41312,  "gameId":"7-11434766", "round":2,
           "sourceTeamId":"XXT1", "targetTeamId":"XXT1",
           "nbPoint":2, "status":"REGISTERED"}
      ],
      "XXT2":[
         { "id":41310, "gameId":"7-11434766", "round":2,
           "sourceTeamId":"XXT2",  "targetTeamId":"XXT2",
           "nbPoint":5, "status":"REGISTERED"
         },
         {"id":41313, "gameId":"7-11434766", "round":2,
           "sourceTeamId":"XXT2", "targetTeamId":"XXT1",
            "nbPoint":5,  "status":"REGISTERED"
         }
      ]
   }
}</pre>
    </div>
</div>


<h2>Liste des commandes complémentaires pour le training server :</h2>

<div class="panel panel-warning">
    <div class="panel-heading">Permet de créer une <cite title="Source Title">Battle</cite></div>
    <div class="panel-body">
        Seulement sur ce serveur : il est possible de définir la durée d'un round avec roundTime (en secondes). Une valeur à 0 signifie que le serveur attend que chaque team ai joué son tour puis fini le round immédiatement après avoir reçu les actions de la dernière team.<br><br>
        <blockquote>
            <samp><?php echo "http://" . $_SERVER['SERVER_NAME']; ?>/battle/create?<kbd>teamId</kbd>=<code>str</code>&<kbd>token</kbd>=<code>str</code>&<kbd>roundTime</kbd>=<code>seconds</code></samp>
        </blockquote>
        Résultat JSON :
<pre>{
    gameId : 213534523412343,
    gameToken : ERV455V4F55S54FS5GF4
}</pre>
    </div>
</div>

<div class="panel panel-warning">
    <div class="panel-heading">Joindre une <cite title="Source Title">Battle</cite></div>
    <div class="panel-body">
        <blockquote>
            <samp><?php echo "http://" . $_SERVER['SERVER_NAME']; ?>/battle/join?<kbd>gameId</kbd>=<code>str</code>&<kbd>gameToken</kbd>=<code>str</code>&<kbd>teamId</kbd>=<code>str</code>&<kbd>profile</kbd>=<code>Tank|Normal|Assassin</code></samp>
        </blockquote>
        Code http réponse :
<pre>200 - Requête OK
500 - KO</pre>
    </div>
</div>

<div class="panel panel-warning">
    <div class="panel-heading">Démarrer une <cite title="Source Title">Battle</cite></div>
    <div class="panel-body">
        <blockquote>
            <samp><?php echo "http://" . $_SERVER['SERVER_NAME']; ?>/battle/start?<kbd>gameId</kbd>=<code>str</code>&<kbd>gameToken</kbd>=<code>str</code></samp>
        </blockquote>
        Code http réponse :
<pre>200 - Requête OK
500 - KO</pre>
    </div>
</div>