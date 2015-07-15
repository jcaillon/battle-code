<?php
/**
 * Created by PhpStorm.
 * User: Julien
 * Date: 18/04/2015
 * Time: 00:21
 */

abstract class Params {
    public static $profilLP = array("Tank"=>150, "Normal"=>100, "Assassin"=>50);
    public static $profilPA = array("Tank"=>5, "Normal"=>10, "Assassin"=>20);
    public static $profilName = array("Tank", "Normal", "Assassin");
    public static $gameStatus = array(0 => "PLANNED", 1 => "STARTED", 2 => "ENDED");
    public static $actionStatus = array(0 => "REGISTERED", 1 => "APPLIED", 2 => "PENALISED", 3 => "IGNORED");
}