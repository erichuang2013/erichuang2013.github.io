var $builtinmodule = function(name)
{
    var mod = {};
    mod.playSound = new Sk.builtin.func(function(sound_num){
        playSound(Sk.builtin.str(sound_num));

        return new Sk.builtin.none;
    })
    return mod;
}